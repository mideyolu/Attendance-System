import { useCallback } from "react";

export const useNumberAnimation = () => {
    const animateNumber = useCallback((target, callback, duration = 900) => {
        return new Promise((resolve) => {
            const startTime = performance.now();

            const step = (now) => {
                const progress = Math.min((now - startTime) / duration, 1);
                const value = Math.round(progress * target);

                callback(value);

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(step);
        });
    }, []);

    return { animateNumber };
};
