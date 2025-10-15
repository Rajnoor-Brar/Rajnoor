// (function(){
//     const textEl = document.getElementById('get-things-done');
//     if (!textEl) return;

//     function calcProgress() {
//         const rect = textEl.getBoundingClientRect();
//         const vh = window.innerHeight || document.documentElement.clientHeight;

//         // Start animation when bottom of element is near viewport bottom
//         const start = vh * 0.9;
//         // Fully drawn when top reaches near viewport top
//         const end = vh * 0.1;

//         let progress = (start - rect.top) / (start - end);
//         return Math.min(Math.max(progress, 0), 1);
//     }

//     let ticking = false;
//     function onScroll() {
//         if (ticking) return;
//         ticking = true;
//         requestAnimationFrame(() => {
//             const progress = calcProgress();
//             if (progress >= 0.98) {
//                 textEl.classList.add('filled');
//             } else {
//                 textEl.classList.remove('filled');
//             }
//             ticking = false;
//         });
//     }

//     window.addEventListener('scroll', onScroll, {passive:true});
//     window.addEventListener('resize', onScroll);
//     onScroll();
// })();

(function(){
    const lines = document.querySelectorAll('.trace');
    if (!lines.length) return;

    lines.forEach(line => {
        const length = line.getComputedTextLength();
        line.style.strokeDasharray = length;
        line.style.strokeDashoffset = length;
    });

    function calcProgress(el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const start = vh * 0.9;
        const end = vh * 0.1;
        let progress = (start - rect.top) / (start - end);
        return Math.min(Math.max(progress, 0), 1);
    }

    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            lines.forEach(line => {
                const length = line.getComputedTextLength();
                const progress = calcProgress(line);
                line.style.strokeDashoffset = length * (1 - progress);
                if (progress >= 0.98) {
                    line.classList.add('filled');
                } else {
                    line.classList.remove('filled');
                }
            });
            ticking = false;
        });
    }

    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
    onScroll();
})();