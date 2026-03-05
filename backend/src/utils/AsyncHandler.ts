const asyncHandler = (fn: (req: any, res: any, next: any) => Promise<any>) =>
    async (req: any, res: any, next: any) => {
        try {
            await fn(req, res, next);
        } catch (err: any) {
            const statusCode = err.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                statusCode,
                message: err.message || "Internal Server Error",
                errors: err.errors || [],
            });
        }
    };

export { asyncHandler };