document.addEventListener('DOMContentLoaded', () => {
    const typeInput = document.querySelector('[name="testType"]');
    const payloadItems = document.querySelectorAll('#payload-list li');
 
    if (!typeInput || !payloadItems.length) return;
 
    function updateRecommendations() {
        if (!window.agents) return;
        
        const type = typeInput.value;
        if (!type) {
            payloadItems.forEach(item => {
                const badge = item.querySelector('.recommendation');
                if (badge) badge.style.display = 'none';
            });
            return;
        }
 
        const requirements = new Map(); // type -> 'REQUIRED' | 'RECOMMENDED'
 
        window.agents.forEach(a => {
            const t = a.supportedTests.find(tt => tt.testType === type);
            if (t) {
                t.required.forEach(r => requirements.set(r, 'REQUIRED'));
                t.optional.forEach(o => {
                    if (requirements.get(o) !== 'REQUIRED') requirements.set(o, 'RECOMMENDED');
                });
            }
        });
 
        payloadItems.forEach(item => {
            const pType = item.dataset.type;
            const badge = item.querySelector('.recommendation');
            if (!badge) return;
            
            const state = requirements.get(pType);
 
            if (state) {
                badge.textContent = state;
                badge.style.display = 'inline-block';
                badge.className = 'recommendation status status-badge ' + (state === 'REQUIRED' ? 'status-failed' : 'status-completed');
            } else {
                badge.style.display = 'none';
            }
        });
    }
 
    typeInput.addEventListener('change', updateRecommendations);
    typeInput.addEventListener('input', updateRecommendations);
    updateRecommendations();
});
