fetch('./resources/includes.html')
            .then(response => response.text())
            .then(data => {
                document.head.insertAdjacentHTML('beforeend', data);
            })
            .catch(error => console.error('Error loading headers:', error));