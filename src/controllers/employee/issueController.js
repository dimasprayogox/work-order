import { Issue } from "../../models/Issue.js";
import { Machine } from "../../models/Machine.js";
import { WorkOrder } from "../../models/WorkOrder.js";
import path from "path";
import { notifyManager } from "../../utils/notifyManager.js";
import { minioClient, checkAndCreateBucket } from "../../utils/minio.js";
import { v4 as uuidv4 } from "uuid";
import { createIssueSchema, updateIssueSchema } from "../../schemas/employee/issueSchema.js";
import dotenv from "dotenv";
dotenv.config();

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

                await minioClient.putObject(bucketName, objectName, req.file.buffer, req.file.size, {
                    "Content-Type": req.file.mimetype,
                });

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
                reported_by_id: req.user.userId,
            });

            await Machine.query().patchAndFetchById(machine_id, { status: "maintenance" });

            const workOrder = await WorkOrder.query().insert({
                id: uuidv4(),
                machine_id,
                title: newIssue.title,
                description: newIssue.description,
                status: "pending",
                created_by_id: req.user.userId,
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
            const issues = await Issue.query().withGraphFetched("[machine, workOrder]").orderBy("created_at", "desc");
            res.status(200).json({ message: "Issues fetched successfully", data: issues });
        } catch (err) {
            console.error("Error fetching issues:", err);
            res.status(500).json({ message: "Failed to fetch issues", error: err.message });
        }
    },

    async getById(req, res) {
        try {
            const id = req.params.id;
            const issue = await Issue.query().findById(id).withGraphFetched("[machine, workOrder]");
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
            console.log("Parsed data for update:", data);

            const existingIssue = await Issue.query().findById(id);
            if (!existingIssue) {
                return res.status(404).json({ message: "Issue not found" });
            }

            const updateData = { ...data };

            if (req.file) {
                const bucketName = process.env.MINIO_BUCKET_NAME;
                const folderName = "photo-issue";
                await checkAndCreateBucket(bucketName);

                const originalFileName = `${id}${path.extname(req.file.originalname)}`;
                const objectName = `${folderName}/${originalFileName}`;

                await minioClient.putObject(bucketName, objectName, req.file.buffer, req.file.size, {
                    "Content-Type": req.file.mimetype,
                });

                updateData.photo_url = `${process.env.MINIO_PUBLIC_URL || "http://localhost:9000"}/${bucketName}/${objectName}`;
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
};
