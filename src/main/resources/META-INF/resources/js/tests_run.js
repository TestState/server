document.addEventListener('DOMContentLoaded', () => {
    const agentCheckboxes = document.querySelectorAll('input[name="agentIds"]');
    const extraItems = document.querySelectorAll('#extra-payload-list li');
 
    function updateRecommendations() {
        if (!window.agents || !window.testType) return;
        
        const selectedAgentIds = Array.from(agentCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const requirements = new Map(); // type -> 'REQUIRED' | 'RECOMMENDED'

        window.agents.forEach(a => {
            // Only consider selected agents OR if no agents are selected, consider all compatible ones
            if (selectedAgentIds.length > 0 && !selectedAgentIds.includes(a.id)) return;

            const t = a.supportedTests.find(tt => tt.testType === window.testType);
            if (t) {
                t.required.forEach(r => requirements.set(r, 'REQUIRED'));
                t.optional.forEach(o => {
                    if (requirements.get(o) !== 'REQUIRED') requirements.set(o, 'RECOMMENDED');
                });
            }
        });
 
        extraItems.forEach(item => {
            const pType = item.dataset.type;
            const badge = item.querySelector('.recommendation');
            if (!badge) return;
            
            const state = requirements.get(pType);
 
            if (state) {
                badge.textContent = state;
                badge.classList.remove('d-none');
                badge.className = 'recommendation status ' + (state === 'REQUIRED' ? 'status-failed' : 'status-completed');
            } else {
                badge.classList.add('d-none');
            }
        });
    }
 
    agentCheckboxes.forEach(cb => cb.addEventListener('change', updateRecommendations));
    updateRecommendations();
});
