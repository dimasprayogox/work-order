import { Issue } from "../../models/Issue.js";
import { Machine } from "../../models/Machine.js";
import { WorkOrder } from "../../models/WorkOrder.js";
import path from "path";
import { notifyManager } from "../../utils/notifyManager.js";
import { minioClient, checkAndCreateBucket } from "../../utils/minio.js";
import { v4 as uuidv4 } from "uuid";
import { createIssueSchema } from "../../schemas/employee/issueSchema.js";
import dotenv from "dotenv"
dotenv.config()

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
                const bucketName = process.env.Minio_BUCKET_NAME;
                const folderName = "photo-issue"; 

                // 1. Pastikan bucket 'work-order' ada (tidak perlu cek manual lagi)
                await checkAndCreateBucket(bucketName);

                // 2. Buat nama file asli dan nama objek lengkap dengan folder
                const originalFileName = `${issueId}${path.extname(req.file.originalname)}`;
                const objectName = `${folderName}/${originalFileName}`; 

                // 3. Unggah objek ke MinIO dengan nama yang sudah ada foldernya
                await minioClient.putObject(
                    bucketName,
                    objectName, 
                    req.file.buffer,
                    req.file.size,
                    {
                        'Content-Type': req.file.mimetype  // browser bisa tampilkan sesuai tipe file
                    }
                );

                // 4. Buat URL publik yang benar
                photoUrl = `${process.env.MINIO_PUBLIC_URL || "http://localhost:9000"}/${bucketName}/${objectName}`;
            }

            // Pastikan req.user.userId ada dan valid dari middleware otentikasi Anda
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ message: "Authentication error: User ID not found." });
            }
            console.log("User ID:", req.user.userId); // Debugging log untuk memastikan userId ada

            // Buat issue
            const newIssue = await Issue.query().insert({
                id: issueId,
                machine_id,
                title,
                description,
                photo_url: photoUrl,
                status: "open",
                reported_by_id: req.user.userId,
            });

            // Update status mesin
            await Machine.query().patchAndFetchById(machine_id, {
                status: "maintenance",
            });

            // Buat work order
            const workOrder = await WorkOrder.query().insert({
                id: uuidv4(),
                machine_id,
                title: newIssue.title,
                description: newIssue.description,
                status: "pending",
                created_by_id: req.user.userId,
                issue_id: newIssue.id,
            });
            
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
            console.error("Error creating issue:", err); // Log error lengkap untuk debugging
            res.status(500).json({ message: "Failed to create issue", error: err.message });
        }
    },
    // Ambil semua issue
    async getAll(req, res) {
        try {
        const issues = await Issue.query()
            .withGraphFetched("[machine, workOrder]") // ikutkan relasi kalau ada
            .orderBy("created_at", "desc");

        res.status(200).json({
            message: "Issues fetched successfully",
            data: issues,
        });
        } catch (err) {
        console.error("Error fetching issues:", err);
        res.status(500).json({ message: "Failed to fetch issues", error: err.message });
        }
    },

    // Ambil issue berdasarkan ID
    async getById(req, res) {
        try {
        const { id } = req.params;

        const issue = await Issue.query()
            .findById(id)
            .withGraphFetched("[machine, workOrder]"); // ikutkan relasi kalau ada

        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        res.status(200).json({
            message: "Issue fetched successfully",
            data: issue,
        });
        } catch (err) {
        console.error("Error fetching issue by ID:", err);
        res.status(500).json({ message: "Failed to fetch issue", error: err.message });
        }
    },
};
