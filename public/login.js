document.getElementById('login-form').onsubmit = async function(event) {
	event.preventDefault();
	const formData = new FormData(event.target);
	const data = {
		email: formData.get('username'),
		password: formData.get('password')
	};

	const response = await fetch('http://localhost:8080/api/auth/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});

	if (response.ok) {
		const result = await response.json();
		if (result.token) {
			localStorage.setItem('token', result.token);
			window.location.href = 'index.html';
		} else {
			alert('Login failed: No token received.');
		}
	} else {
		const error = await response.json();
		alert(`Login failed: ${error.message}`);
	}
};
