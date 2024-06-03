$(document).ready(function() {
	const token = localStorage.getItem('token');
	if (!token) {
		window.location.href = 'login.html';
		return;
	}

	const apiUrl = 'http://localhost:8080/api';
	const versionsList = document.getElementById('versions');
	const detailsDiv = document.getElementById('details');

	async function fetchVersions() {
		const response = await fetch(`${apiUrl}/versions`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});
		const versions = await response.json();
		versionsList.innerHTML = '';
		versions.forEach(version => {
			const tr = document.createElement('tr');
			tr.innerHTML = `
                <td>${version.appName}</td>
                <td>${version.versionId}</td>
                <td>${version.releaseDate}</td>
                <td>${version.totalVariants}</td>
                <td>${version.distributionNumber || 'N/A'}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="window.fetchVersionDetails('${version.versionId}')">Details</button>
                    <button class="btn btn-danger btn-sm" onclick="window.deleteVersion('${version.versionId}')">Delete</button>
                </td>
            `;
			versionsList.appendChild(tr);
		});
	}

	window.fetchVersionDetails = async function(id) {
		const response = await fetch(`${apiUrl}/versions/${id}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});
		const details = await response.json();
		detailsDiv.innerHTML = `<h3>Version ID: ${id}</h3>`;
		details.forEach(detail => {
			const div = document.createElement('div');
			div.innerHTML = `
                <p>Variant ID: ${detail.variantId}</p>
                <p>Architecture: ${detail.architecture}</p>
                <p>Min Android Version: ${detail.minAndroidVersion}</p>
                <p>DPI: ${detail.dpi}</p>
            `;
			detailsDiv.appendChild(div);
		});
		$('#versionDetailsModal').modal('show');
	};

	window.deleteVersion = async function(id) {
		await fetch(`${apiUrl}/versions/${id}`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});
		fetchVersions();
	};

	fetchVersions();
});
