import { Issue } from "../../models/Issue.js";
import { Machine } from "../../models/Machine.js";
import { WorkOrder } from "../../models/WorkOrder.js";
import path from "path";
import { notifyManager } from "../../utils/notifyManager.js";
import { minioClient, checkAndCreateBucket, getMinioPublicUrl, transformMinioUrl } from "../../utils/minio.js";
import { v4 as uuidv4 } from "uuid";
import { createIssueSchema, updateIssueSchema } from "../../schemas/employee/issueSchema.js";
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
    const publicUrl = getMinioPublicUrl();
    const objectName = url.replace(`${publicUrl}/${bucketName}/`, "");

    try {
        await minioClient.removeObject(bucketName, objectName);
    } catch (err) {
        console.warn(`Gagal menghapus file dari MinIO: ${objectName}`, err.message);
    }
};

export const IssueController = {
    async store(req, res) {
        try {
            const parsed = createIssueSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const { machine_id, title, description } = parsed.data;

            const machine = await Machine.query().findById(machine_id);
            if (!machine) {
                return res.status(404).json({ message: "Machine not found" });
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

                photoUrl = `${getMinioPublicUrl()}/${bucketName}/${objectName}`;
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
                reported_by_id: req.user.userId,
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
                created_by_id: newIssue.reported_by_id, // Link to the user who reported the issue
                issue_id: newIssue.id,
            });

            await notifyManager({
                subject: "New Issue Reported",
                message: `Issue "${title}" created for machine ${machine.name}.`,
                issueId: newIssue.id,
                machineId: machine_id,
            });

            res.status(201).json({
                message: "Issue created, machine set to maintenance, work order generated, manager notified.",
                data: { issue: newIssue, workOrder },
            });
        } catch (err) {
            console.error("Error creating issue:", err);
            res.status(500).json({ message: "Failed to create issue", error: err.message });
        }
    },

    async getAll(req, res) {
        try {
            const issues = await Issue.query()
                .withGraphFetched("[machine, workOrder]")
                .orderBy("created_at", "desc");
                
            // Transform MinIO URLs to use the current public URL
            const transformedIssues = issues.map(issue => ({
                ...issue,
                photo_url: transformMinioUrl(issue.photo_url)
            }));
            
            res.status(200).json({ message: "Issues fetched successfully", data: transformedIssues });
        } catch (err) {
            console.error("Error fetching issues:", err);
            res.status(500).json({ message: "Failed to fetch issues", error: err.message });
        }
    },

    async getMyIssues(req, res) {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ message: "Unauthorized: You must be logged in to view your issues." });
            }

            const userId = req.user.userId;
            const issues = await Issue.query()
                .where("reported_by_id", userId)
                .withGraphFetched("[machine, workOrder]")
                .orderBy("created_at", "desc");

            // Transform MinIO URLs to use the current public URL
            const transformedIssues = issues.map(issue => ({
                ...issue,
                photo_url: transformMinioUrl(issue.photo_url)
            }));

            res.status(200).json({ message: "Your issues fetched successfully", data: transformedIssues });
        } catch (err) {
            console.error("Error fetching user's own issues:", err);
            res.status(500).json({ message: "Failed to fetch your issues", error: err.message });
        }
    },

    async getById(req, res) {
        try {
            const id = req.params.id;
            const issue = await Issue.query()
                .findById(id)
                .withGraphFetched("[machine, workOrder]");
            if (!issue) {
                return res.status(404).json({ message: "Issue not found" });
            }
            
            // Transform MinIO URL to use the current public URL
            const transformedIssue = {
                ...issue,
                photo_url: transformMinioUrl(issue.photo_url)
            };
            
            res.status(200).json({ message: "Issue fetched successfully", data: transformedIssue });
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

            const updateData = {};

            if (data.title !== undefined) {
                updateData.title = data.title;
            }
            if (data.description !== undefined) {
                updateData.description = data.description;
            }
            if (data.machine_id !== undefined) {
                updateData.machine_id = data.machine_id;
            }

            if (req.file) {
                if (existingIssue.photo_url) {
                    await removeMinioObject(existingIssue.photo_url);
                }

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

                updateData.photo_url = `${getMinioPublicUrl()}/${bucketName}/${objectName}`;
            } else if (req.body.remove_photo === "true") {
                if (existingIssue.photo_url) {
                    await removeMinioObject(existingIssue.photo_url);
                }
                updateData.photo_url = null;
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ message: "No valid data provided for update." });
            }

            const updatedIssue = await Issue.query().patchAndFetchById(id, updateData);

            res.status(200).json({ message: "Issue updated successfully", data: updatedIssue });
        } catch (err) {
            console.error("Error updating issue:", err);
            res.status(500).json({ message: "Failed to update issue", error: err.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const issue = await Issue.query().findById(id);
            if (!issue) {
                return res.status(404).json({ message: "Issue not found." });
            }

            if (issue.status !== "open") {
                return res.status(400).json({ message: "Only issues with status 'open' can be deleted." });
            }

            await removeMinioObject(issue.photo_url);

            await WorkOrder.query().delete().where("issue_id", id);

            await Issue.query().deleteById(id);

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

                const nonOpenIssues = issuesToDelete.filter((issue) => issue.status !== "open");
                if (nonOpenIssues.length > 0) {
                    throw {
                        status: 400,
                        message: `Only open issues can be deleted. Issues with other statuses: ${nonOpenIssues.map((i) => i.id).join(", ")}`,
                    };
                }

                const machineIds = [...new Set(issuesToDelete.map((issue) => issue.machine_id))];

                for (const issue of issuesToDelete) {
                    await removeMinioObject(issue.photo_url);
                }

                await WorkOrder.query(trx).delete().whereIn("issue_id", ids);
                const deleteCount = await Issue.query(trx).delete().whereIn("id", ids);

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
};