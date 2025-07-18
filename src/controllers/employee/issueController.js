import { Issue } from "../../models/Issue.js";
import { Machine } from "../../models/Machine.js";
import { WorkOrder } from "../../models/WorkOrder.js";
import path from "path";
import { notifyManager } from "../../utils/notifyManager.js";
import { minioClient } from "../../utils/minio.js";
import { v4 as uuidv4 } from "uuid";
import { createIssueSchema } from "../../schemas/employee/issueSchema.js";

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

            // Cek mesin
            const machine = await Machine.query().findById(machine_id);
            if (!machine) {
                return res.status(404).json({ message: "Machine not found" });
            }

            // Buat issue id dulu
            const issueId = uuidv4();

            let photoUrl = null;
            if (req.file) {
                const bucketName = "work-order";
                const fileName = `${issueId}${path.extname(req.file.originalname)}`;
                // Pastikan bucket work-order ada
                const bucketExists = await minioClient.bucketExists(bucketName);
                if (!bucketExists) {
                    await minioClient.makeBucket(bucketName);
                }
                await minioClient.putObject(
                    bucketName,
                    fileName,
                    req.file.buffer,
                    req.file.size,
                    req.file.mimetype
                );
                photoUrl = `${process.env.MINIO_PUBLIC_URL || "http://localhost:9000"}/${bucketName}/${fileName}`;
            }

            console.log(req.user.userId); // Debugging line to check user ID);
            // Buat issue
          const newIssue = await Issue.query().insert({
            id: issueId,
            machine_id,
            title,
            description,
            photo_url: photoUrl,
            status: "open",
            reported_by_id: req.user.userId, // <-- kemungkinan field ini salah
        });

            // Update status mesin
            await Machine.query().patchAndFetchById(machine_id, {
                status: "maintenance",
            });

            // Buat work order
            const workOrder = await WorkOrder.query().insert({
                id: uuidv4(),
                machine_id,
                status: "open",
                created_by_id: req.user.userId, // ID user yang membuat work order
            });
            workOrder.issue_id = newIssue.id; // Set issue_id pada work order
            // Notify manager
            await notifyManager({
                subject: "New Issue Reported",
                message: `Issue "${title}" created for machine ${machine.name}.`,
                issueId: newIssue.id,
                machineId: machine_id,
            });

            res.status(201).json({
                message: "Issue created, machine set to maintenance, work order generated, manager notified.",
                data: {
                    issue: newIssue,
                    workOrder,
                },
            });
        } catch (err) {
            res.status(500).json({ message: "Failed to create issue", error: err.message });
        }
    },
};