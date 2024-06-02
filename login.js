document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();

    document.getElementById('loginButton').addEventListener('click', function() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        fetch('http://127.0.0.1:8000/centralized_API_backend/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                chrome.storage.sync.set({ userEmail: email, userToken: data.token }, function() {
                    console.log('Login successful. User email and token saved');
                    displayUserInfo(email);
                });
            } else {
                document.getElementById('status').textContent = 'Login failed: ' + data.message;
                document.getElementById('status').style.color = 'red';
            }
        })
        .catch(error => {
            document.getElementById('status').textContent = 'Error: ' + error.message;
            document.getElementById('status').style.color = 'red';
        });
    });

    document.getElementById('logoutButton').addEventListener('click', function() {
        chrome.storage.sync.remove(['userEmail', 'userToken'], function() {
            console.log('User logged out');
            displayLoginForm();
        });
    });
});

function checkLoginStatus() {
    chrome.storage.sync.get(['userEmail'], function(result) {
        if (result.userEmail) {
            displayUserInfo(result.userEmail);
        } else {
            displayLoginForm();
        }
    });
}

function displayUserInfo(email) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('userInfo').style.display = 'block';
    document.getElementById('userEmail').textContent = `Logged in as: ${email}`;
}

function displayLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('status').textContent = '';
}
