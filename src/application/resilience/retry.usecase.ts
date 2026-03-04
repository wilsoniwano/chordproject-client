export async function runWithRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError;
}

