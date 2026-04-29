const loginButton = document.getElementById('LoginBtn');
const signupButton = document.getElementById('SignupBtn');


console.log('Login Button:', loginButton);
console.log('Signup Button:', signupButton);

loginButton.addEventListener('click', () => {
    console.log('Login button clicked');
    window.location.href = 'src/login.html';
}
);

signupButton.addEventListener('click', () => {
    console.log('Signup button clicked');
    window.location.href = 'src/signup.html';
}
);