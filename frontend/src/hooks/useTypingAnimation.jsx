
import { useCallback } from "react";

export const useTypingAnimation = () => {
    const typeText = useCallback((text, callback, speed = 50) => {
        return new Promise((resolve) => {
            if (!text) {
                resolve();
                return;
            }

            let i = 0;

            const interval = setInterval(() => {
                i++;
                callback(text.slice(0, i));

                if (i === text.length) {
                    clearInterval(interval);
                    resolve();
                }
            }, speed);
        });
    }, []);

    return { typeText };
};
