//src/controllers/admin/issueAdminController.js

import { Issue } from "../../models/Issue.js";
import { Machine } from "../../models/Machine.js";
import { Asset } from "../../models/Asset.js";
import { WorkOrder } from "../../models/WorkOrder.js";
import { User } from "../../models/User.js";
import path from "path";
import { notifyManager } from "../../utils/notifyManager.js";
import { minioClient, checkAndCreateBucket, getMinioPublicUrl, transformMinioUrl } from "../../utils/minio.js";
import { v4 as uuidv4 } from "uuid";
import { createIssueAdminSchema, updateIssueAdminSchema } from "../../schemas/admin/issueSchema.js";
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

export const IssueAdminController = {
    async store(req, res) {
        try {
            const parsed = createIssueAdminSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const { type, machine_id, asset_id, title, description, priority = "medium" } = parsed.data;

            // Validate target exists based on type
            let targetEntity = null;
            if (type === "machine") {
                targetEntity = await Machine.query().findById(machine_id);
                if (!targetEntity) {
                    return res.status(404).json({ message: "Machine not found" });
                }
            } else if (type === "asset") {
                targetEntity = await Asset.query().findById(asset_id);
                if (!targetEntity) {
                    return res.status(404).json({ message: "Asset not found" });
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

                photoUrl = `${getMinioPublicUrl()}/${bucketName}/${objectName}`;
            }

            // Admin bisa set reported_by_id dari body, fallback ke req.user.userId jika ada
            const reportedById = req.body.reported_by_id || (req.user && req.user.userId) || null;

            const newIssue = await Issue.query().insert({
                id: issueId,
                machine_id: type === "machine" ? machine_id : null,
                asset_id: type === "asset" ? asset_id : null,
                title,
                description,
                photo_url: photoUrl,
                status: "open",
                reported_by_id: reportedById,
            });

            // Update target entity status based on type
            if (type === "machine") {
                await Machine.query().patchAndFetchById(machine_id, {
                    status: "down",
                });
            } else if (type === "asset") {
                await Asset.query().patchAndFetchById(asset_id, {
                    status: "down",
                });
            }

            const workOrder = await WorkOrder.query().insert({
                id: uuidv4(),
                machine_id: type === "machine" ? machine_id : null,
                asset_id: type === "asset" ? asset_id : null,
                title: newIssue.title,
                description: newIssue.description,
                priority,
                status: "pending",
                created_by_id: newIssue.reported_by_id,
                issue_id: newIssue.id,
            });

            await notifyManager({
                subject: `New Issue Reported (Admin) - ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                message: `Issue "${title}" created for ${type} ${targetEntity.name} by admin.`,
                issueId: newIssue.id,
                machineId: type === "machine" ? machine_id : null,
                assetId: type === "asset" ? asset_id : null,
            });

            res.status(201).json({
                message: `Issue created by admin, ${type} set to maintenance, work order generated, manager notified.`,
                data: { issue: newIssue, workOrder },
            });
        } catch (err) {
            res.status(500).json({ message: "Failed to create issue", error: err.message });
        }
    },

    async getAll(req, res) {
        try {
            const issues = await Issue.query()
                .withGraphFetched("[machine, asset, workOrder, reportedBy]")
                .orderBy("created_at", "desc");
                
            // Transform MinIO URLs and normalize workOrder.repairable to boolean/null
            const normalizeRepairable = (val) => {
                if (val === null || val === undefined) return null;
                if (typeof val === 'boolean') return val;
                if (val === 1 || val === '1' || String(val).toLowerCase() === 'true' || String(val).toLowerCase() === 't') return true;
                if (val === 0 || val === '0' || String(val).toLowerCase() === 'false' || String(val).toLowerCase() === 'f') return false;
                return null;
            };

            const transformedIssues = issues.map(issue => {
                const transformed = { ...issue, photo_url: transformMinioUrl(issue.photo_url) };
                if (transformed.workOrder) {
                    transformed.workOrder = {
                        ...transformed.workOrder,
                        repairable: normalizeRepairable(transformed.workOrder.repairable)
                    };
                }
                return transformed;
            });
            
            res.status(200).json({ message: "Issues fetched successfully", data: transformedIssues });
        } catch (err) {
            res.status(500).json({ message: "Failed to fetch issues", error: err.message });
        }
    },

    async getUsers(req, res) {
        try {
            const users = await User.query()
                .select('id', 'full_name', 'email', 'role')
                .orderBy('full_name', 'asc');
            res.status(200).json({ message: "Users fetched successfully", data: users });
        } catch (err) {
            res.status(500).json({ message: "Failed to fetch users", error: err.message });
        }
    },

    async getAssets(req, res) {
        try {
            const assets = await Asset.query()
                .withGraphFetched('[category, division]')
                .where('status', '!=', 'inactive')
                .orderBy('name', 'asc');
            res.status(200).json({ message: "Assets fetched successfully", data: assets });
        } catch (err) {
            res.status(500).json({ message: "Failed to fetch assets", error: err.message });
        }
    },
    
    async getById(req, res) {
        try {
            const id = req.params.id;
            const issue = await Issue.query()
                .findById(id)
                .withGraphFetched("[machine, asset, workOrder, reportedBy]");
            if (!issue) {
                return res.status(404).json({ message: "Issue not found" });
            }
            
            // Transform MinIO URL and normalize workOrder.repairable to boolean/null
            const normalizeRepairable = (val) => {
                if (val === null || val === undefined) return null;
                if (typeof val === 'boolean') return val;
                if (val === 1 || val === '1' || String(val).toLowerCase() === 'true' || String(val).toLowerCase() === 't') return true;
                if (val === 0 || val === '0' || String(val).toLowerCase() === 'false' || String(val).toLowerCase() === 'f') return false;
                return null;
            };

            const transformedIssue = { ...issue, photo_url: transformMinioUrl(issue.photo_url) };
            if (transformedIssue.workOrder) {
                transformedIssue.workOrder = {
                    ...transformedIssue.workOrder,
                    repairable: normalizeRepairable(transformedIssue.workOrder.repairable)
                };
            }
            
            res.status(200).json({ message: "Issue fetched successfully", data: transformedIssue });
        } catch (err) {
            res.status(500).json({ message: "Failed to fetch issue", error: err.message });
        }
    },

    async update(req, res) {
        try {
            const id = req.params.id;
            const parsed = updateIssueAdminSchema.safeParse(req.body);
            
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
            if (data.type !== undefined) {
                // Handle type change
                if (data.type === "machine" && data.machine_id) {
                    updateData.machine_id = data.machine_id;
                    updateData.asset_id = null;
                } else if (data.type === "asset" && data.asset_id) {
                    updateData.asset_id = data.asset_id;
                    updateData.machine_id = null;
                }
            } else {
                // Handle individual ID updates without type change
                if (data.machine_id !== undefined) {
                    updateData.machine_id = data.machine_id;
                }
                if (data.asset_id !== undefined) {
                    updateData.asset_id = data.asset_id;
                }
            }
            if (data.reported_by_id !== undefined) {
                updateData.reported_by_id = data.reported_by_id;
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
            // error logged
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
            // error logged
            const statusCode = err.status || 500;
            res.status(statusCode).json({
                message: err.message || "Failed to delete issues",
                error: process.env.NODE_ENV === "development" ? err.stack : undefined,
            });
        }
    },
};