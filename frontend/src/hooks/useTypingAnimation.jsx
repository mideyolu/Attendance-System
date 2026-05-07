// export const useTypingAnimation = () => {
//     const typeText = (text, callback, speed = 50) => {
//         let i = 0;

//         const interval = setInterval(() => {
//             callback(text.slice(0, i + 1));
//             i++;
//             if (i === text.length) clearInterval(interval);
//         }, speed);
//     };

//     return { typeText };
// };


import { useCallback } from "react";

export const useTypingAnimation = () => {
    const typeText = useCallback((text, callback, speed = 50) => {
        return new Promise((resolve) => {
            if (!text) {
                resolve();
                return;
            }

            let i = 0;
            // Clear any existing intervals if necessary, 
            // but for simple usage, we just start a new one.
            
            const interval = setInterval(() => {
                i++;
                callback(text.slice(0, i));
                
                if (i === text.length) {
                    clearInterval(interval);
                    resolve(); // ✅ Resolve promise when done
                }
            }, speed);
        });
    }, []);

    return { typeText };
};