// import { useCallback } from "react";

// export const useNumberAnimation = () => {
//     const animateNumber = useCallback((target, callback, duration = 900) => {
//         const startTime = performance.now();

//         const step = (now) => {
//             const progress = Math.min((now - startTime) / duration, 1);
//             const value = Math.floor(progress * target);

//             callback(value);

//             if (progress < 1) requestAnimationFrame(step);
//         };

//         requestAnimationFrame(step);
//     }, []);

//     return { animateNumber };
// };


import { useCallback } from "react";

export const useNumberAnimation = () => {
    const animateNumber = useCallback((target, callback, duration = 900) => {
        return new Promise((resolve) => {
            const startTime = performance.now();

            const step = (now) => {
                const progress = Math.min((now - startTime) / duration, 1);
                // Use Math.round for smoother ending, or Math.floor as before
                const value = Math.round(progress * target);

                callback(value);

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    resolve(); // ✅ Resolve promise when done
                }
            };

            requestAnimationFrame(step);
        });
    }, []);

    return { animateNumber };
};