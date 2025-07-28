//src/controllers/admin/issueController.js

import { Issue } from "../../models/Issue.js";
import { Machine } from "../../models/Machine.js";
import { WorkOrder } from "../../models/WorkOrder.js";
import { User } from "../../models/User.js";
import path from "path";
import { notifyManager } from "../../utils/notifyManager.js";
import { minioClient, checkAndCreateBucket } from "../../utils/minio.js";
import { v4 as uuidv4 } from "uuid";
import { createIssueSchema, updateIssueSchema, assignIssueSchema } from "../../schemas/admin/issueSchema.js";
import dotenv from "dotenv";
dotenv.config();

const runInTransaction = async (callback) => {
    const trx = await Issue.startTransaction();
    try {
        const result = await callback(trx);
        await trx.commit();
        return result;
    } catch (error) {
        await trx.rollback();
        throw error;
    }
};

const removeMinioObject = async (url) => {
    if (!url) return;

    const bucketName = process.env.MINIO_BUCKET_NAME;
    const publicUrl = process.env.MINIO_PUBLIC_URL || "http://localhost:9000";
    const objectName = url.replace(`${publicUrl}/${bucketName}/`, "");

    try {
        await minioClient.removeObject(bucketName, objectName);
    } catch (err) {
        console.warn(`Gagal menghapus file dari MinIO: ${objectName}`, err.message);
    }
};

export const AdminIssueController = {
    async store(req, res) {
        try {
            const parsed = createIssueSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const { machine_id, title, description, priority, assigned_to_id } = parsed.data;

            const machine = await Machine.query().findById(machine_id);
            if (!machine) {
                return res.status(404).json({ message: "Machine not found" });
            }

            // Verify assigned user exists if provided
            if (assigned_to_id) {
                const assignedUser = await User.query().findById(assigned_to_id);
                if (!assignedUser) {
                    return res.status(404).json({ message: "Assigned user not found" });
                }
            }

            const issueId = uuidv4();

            let photoUrl = null;
            if (req.file) {
                const bucketName = process.env.MINIO_BUCKET_NAME;
                const folderName = "photo-issue";
                await checkAndCreateBucket(bucketName);

                const originalFileName = `${issueId}${path.extname(req.file.originalname)}`;
                const objectName = `${folderName}/${originalFileName}`;

                await minioClient.putObject(
                    bucketName,
                    objectName,
                    req.file.buffer,
                    req.file.size,
                    { "Content-Type": req.file.mimetype }
                );

                photoUrl = `${process.env.MINIO_PUBLIC_URL || "http://localhost:9000"}/${bucketName}/${objectName}`;
            }

            if (!req.user || !req.user.userId) {
                return res.status(401).json({ message: "Authentication error: User ID not found." });
            }

            const newIssue = await Issue.query().insert({
                id: issueId,
                machine_id,
                title,
                description,
                photo_url: photoUrl,
                status: "open",
                priority: priority || "medium",
                reported_by_id: req.user.userId,
                assigned_to_id: assigned_to_id || null,
            });

            await Machine.query().patchAndFetchById(machine_id, {
                status: "down",
            });

            const workOrder = await WorkOrder.query().insert({
                id: uuidv4(),
                machine_id,
                title: newIssue.title,
                description: newIssue.description,
                status: "pending",
                priority: priority || "medium",
                created_by_id: req.user.userId,
                assigned_to_id: assigned_to_id || null,
                issue_id: newIssue.id,
            });

            await notifyManager({
                subject: "New Issue Reported by Admin",
                message: `Issue "${title}" created for machine ${machine.name} with priority ${priority || "medium"}.`,
                issueId: newIssue.id,
                machineId: machine_id,
            });

            res.status(201).json({
                message: "Issue created successfully by admin.",
                data: { issue: newIssue, workOrder },
            });
        } catch (err) {
            console.error("Error creating issue:", err);
            res.status(500).json({ message: "Failed to create issue", error: err.message });
        }
    },

    async getAll(req, res) {
        try {
            const { status, priority, machine_id, assigned_to_id, page = 1, limit = 20, search } = req.query;
            
            let query = Issue.query()
                .withGraphFetched("[machine, workOrder, reportedBy(basicInfo), assignedTo(basicInfo)]")
                .orderBy("created_at", "desc");

            // Apply filters
            if (status) {
                query = query.where("status", status);
            }
            if (priority) {
                query = query.where("priority", priority);
            }
            if (machine_id) {
                query = query.where("machine_id", machine_id);
            }
            if (assigned_to_id) {
                query = query.where("assigned_to_id", assigned_to_id);
            }
            if (search) {
                query = query.where(builder => {
                    builder
                        .where("title", "ilike", `%${search}%`)
                        .orWhere("description", "ilike", `%${search}%`);
                });
            }

            // Pagination
            const offset = (page - 1) * limit;
            const total = await query.clone().resultSize();
            const issues = await query.limit(limit).offset(offset);

            res.status(200).json({
                message: "Issues fetched successfully",
                data: issues,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (err) {
            console.error("Error fetching issues:", err);
            res.status(500).json({ message: "Failed to fetch issues", error: err.message });
        }
    },

    async getById(req, res) {
        try {
            const id = req.params.id;
            const issue = await Issue.query()
                .findById(id)
                .withGraphFetched("[machine, workOrder, reportedBy(basicInfo), assignedTo(basicInfo)]");
            
            if (!issue) {
                return res.status(404).json({ message: "Issue not found" });
            }
            
            res.status(200).json({ message: "Issue fetched successfully", data: issue });
        } catch (err) {
            console.error("Error fetching issue by ID:", err);
            res.status(500).json({ message: "Failed to fetch issue", error: err.message });
        }
    },

    async update(req, res) {
        try {
            const id = req.params.id;

            const parsed = updateIssueSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const data = parsed.data;
            const existingIssue = await Issue.query().findById(id);
            if (!existingIssue) {
                return res.status(404).json({ message: "Issue not found" });
            }

            // Verify assigned user exists if provided
            if (data.assigned_to_id) {
                const assignedUser = await User.query().findById(data.assigned_to_id);
                if (!assignedUser) {
                    return res.status(404).json({ message: "Assigned user not found" });
                }
            }

            const updateData = { ...data };

            // Handle file upload
            if (req.file) {
                // Remove old file from MinIO
                await removeMinioObject(existingIssue.photo_url);

                const bucketName = process.env.MINIO_BUCKET_NAME;
                const folderName = "photo-issue";
                await checkAndCreateBucket(bucketName);

                const originalFileName = `${id}${path.extname(req.file.originalname)}`;
                const objectName = `${folderName}/${originalFileName}`;

                await minioClient.putObject(
                    bucketName,
                    objectName,
                    req.file.buffer,
                    req.file.size,
                    { "Content-Type": req.file.mimetype }
                );

                updateData.photo_url = `${process.env.MINIO_PUBLIC_URL || "http://localhost:9000"}/${bucketName}/${objectName}`;
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ message: "No valid data provided for update." });
            }

            const updatedIssue = await Issue.query().patchAndFetchById(id, updateData);

            // Update related work order if status or assignment changes
            if (data.status || data.assigned_to_id || data.priority) {
                const workOrderUpdate = {};
                if (data.status) workOrderUpdate.status = data.status === "resolved" ? "completed" : "in_progress";
                if (data.assigned_to_id) workOrderUpdate.assigned_to_id = data.assigned_to_id;
                if (data.priority) workOrderUpdate.priority = data.priority;

                if (Object.keys(workOrderUpdate).length > 0) {
                    await WorkOrder.query()
                        .where("issue_id", id)
                        .patch(workOrderUpdate);
                }
            }

            // Update machine status if issue is resolved
            if (data.status === "resolved") {
                await Machine.query().patchAndFetchById(existingIssue.machine_id, {
                    status: "operational",
                });
            }

            res.status(200).json({ message: "Issue updated successfully", data: updatedIssue });
        } catch (err) {
            console.error("Error updating issue:", err);
            res.status(500).json({ message: "Failed to update issue", error: err.message });
        }
    },

    async assignIssue(req, res) {
        try {
            const id = req.params.id;
            const parsed = assignIssueSchema.safeParse(req.body);
            
            if (!parsed.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const { assigned_to_id, priority } = parsed.data;

            const issue = await Issue.query().findById(id);
            if (!issue) {
                return res.status(404).json({ message: "Issue not found" });
            }

            // Verify assigned user exists
            const assignedUser = await User.query().findById(assigned_to_id);
            if (!assignedUser) {
                return res.status(404).json({ message: "Assigned user not found" });
            }

            const updateData = { assigned_to_id };
            if (priority) updateData.priority = priority;

            const updatedIssue = await Issue.query().patchAndFetchById(id, updateData);

            // Update related work order
            await WorkOrder.query()
                .where("issue_id", id)
                .patch({
                    assigned_to_id,
                    priority: priority || issue.priority,
                    status: "assigned"
                });

            res.status(200).json({ 
                message: "Issue assigned successfully", 
                data: updatedIssue 
            });
        } catch (err) {
            console.error("Error assigning issue:", err);
            res.status(500).json({ message: "Failed to assign issue", error: err.message });
        }
    },

    async changeStatus(req, res) {
        try {
            const id = req.params.id;
            const { status } = req.body;

            const validStatuses = ["open", "in_progress", "resolved", "closed"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ 
                    message: "Invalid status", 
                    validStatuses 
                });
            }

            const issue = await Issue.query().findById(id);
            if (!issue) {
                return res.status(404).json({ message: "Issue not found" });
            }

            const updatedIssue = await Issue.query().patchAndFetchById(id, { status });

            // Update machine status based on issue status
            let machineStatus = "down";
            if (status === "resolved" || status === "closed") {
                machineStatus = "operational";
            }

            await Machine.query().patchAndFetchById(issue.machine_id, {
                status: machineStatus,
            });

            // Update related work order
            let workOrderStatus = "pending";
            if (status === "in_progress") workOrderStatus = "in_progress";
            if (status === "resolved") workOrderStatus = "completed";
            if (status === "closed") workOrderStatus = "cancelled";

            await WorkOrder.query()
                .where("issue_id", id)
                .patch({ status: workOrderStatus });

            res.status(200).json({ 
                message: "Issue status updated successfully", 
                data: updatedIssue 
            });
        } catch (err) {
            console.error("Error changing issue status:", err);
            res.status(500).json({ message: "Failed to change issue status", error: err.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const issue = await Issue.query().findById(id);
            if (!issue) {
                return res.status(404).json({ message: "Issue not found." });
            }

            // Admin can delete any issue, but warn if it's not open
            if (issue.status !== "open") {
                console.warn(`Admin deleting issue ${id} with status: ${issue.status}`);
            }

            // Remove file from MinIO
            await removeMinioObject(issue.photo_url);

            // Delete related work order
            await WorkOrder.query().delete().where("issue_id", id);

            // Delete issue
            await Issue.query().deleteById(id);

            // Reset machine status to operational if this was the only open issue
            const remainingIssues = await Issue.query()
                .where("machine_id", issue.machine_id)
                .whereNotIn("status", ["resolved", "closed"]);

            if (remainingIssues.length === 0) {
                await Machine.query().patchAndFetchById(issue.machine_id, {
                    status: "operational",
                });
            }

            res.status(200).json({ message: "Issue deleted successfully." });
        } catch (err) {
            console.error("Error deleting issue:", err);
            res.status(500).json({ message: "Failed to delete issue", error: err.message });
        }
    },

    async deleteMany(req, res) {
        try {
            const { ids } = req.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    message: "Invalid input: 'ids' must be a non-empty array of issue IDs.",
                });
            }

            const result = await runInTransaction(async (trx) => {
                const issuesToDelete = await Issue.query(trx)
                    .whereIn("id", ids)
                    .withGraphFetched("machine");

                if (issuesToDelete.length !== ids.length) {
                    const foundIds = issuesToDelete.map((i) => i.id);
                    const missingIds = ids.filter((id) => !foundIds.includes(id));
                    throw {
                        status: 404,
                        message: `Some issues not found: ${missingIds.join(", ")}`,
                    };
                }

                const machineIds = [...new Set(issuesToDelete.map((issue) => issue.machine_id))];

                // Remove files from MinIO
                for (const issue of issuesToDelete) {
                    await removeMinioObject(issue.photo_url);
                }

                // Delete related work orders
                await WorkOrder.query(trx).delete().whereIn("issue_id", ids);
                
                // Delete issues
                const deleteCount = await Issue.query(trx).delete().whereIn("id", ids);

                // Update machine statuses
                for (const machineId of machineIds) {
                    const remainingIssues = await Issue.query(trx)
                        .where("machine_id", machineId)
                        .whereNotIn("status", ["resolved", "closed"]);

                    if (remainingIssues.length === 0) {
                        await Machine.query(trx).patchAndFetchById(machineId, {
                            status: "operational",
                        });
                    }
                }

                return {
                    deletedCount: deleteCount,
                    machineUpdates: machineIds.length,
                };
            });

            res.status(200).json({
                message: `Successfully deleted ${result.deletedCount} issues`,
                data: result,
            });
        } catch (err) {
            console.error("Error in deleteMany:", err);
            const statusCode = err.status || 500;
            res.status(statusCode).json({
                message: err.message || "Failed to delete issues",
                error: process.env.NODE_ENV === "development" ? err.stack : undefined,
            });
        }
    },

    async getDashboardStats(req, res) {
        try {
            const stats = await Promise.all([
                Issue.query().where("status", "open").resultSize(),
                Issue.query().where("status", "in_progress").resultSize(),
                Issue.query().where("status", "resolved").resultSize(),
                Issue.query().where("priority", "high").whereNotIn("status", ["resolved", "closed"]).resultSize(),
                Issue.query().where("created_at", ">=", new Date(Date.now() - 24 * 60 * 60 * 1000)).resultSize(),
                Issue.query().where("created_at", ">=", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).resultSize(),
            ]);

            const dashboardData = {
                openIssues: stats[0],
                inProgressIssues: stats[1],
                resolvedIssues: stats[2],
                highPriorityIssues: stats[3],
                todayIssues: stats[4],
                weeklyIssues: stats[5],
            };

            res.status(200).json({
                message: "Dashboard stats fetched successfully",
                data: dashboardData,
            });
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            res.status(500).json({ message: "Failed to fetch dashboard stats", error: err.message });
        }
    },
};