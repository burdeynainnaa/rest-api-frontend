document.getElementById('loadBtn').addEventListener('click', () => {
    fetch('http://localhost:8000/api/tournaments/')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('tournamentsList');
            container.innerHTML = '';
            
            if (data.length === 0) {
                container.innerHTML = '<p>Турнірів поки немає.</p>';
                return;
            }

            data.forEach(tournament => {
                const div = document.createElement('div');
                div.className = 'tournament-card';
                div.innerHTML = `<h3>${tournament.title}</h3><p>Гра: ${tournament.game} | Статус: ${tournament.status}</p>`;
                container.appendChild(div);
            });
        })
        .catch(error => {
            console.error('Помилка завантаження:', error);
            alert('Не вдалося отримати дані з бекенду');
        });
});