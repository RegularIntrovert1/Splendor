document.addEventListener('DOMContentLoaded', function() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
        input.addEventListener('input', function() {
            const strengthBar = this.parentElement.querySelector('.strength-bar');
            const password = this.value;
            
            let strength = 0;
            if (password.match(/[a-z]/)) strength++;
            if (password.match(/[A-Z]/)) strength++;
            if (password.match(/[0-9]/)) strength++;
            if (password.match(/[^A-Za-z0-9]/)) strength++;
            if (password.length > 10) strength++;
            
            const width = Math.min((strength/5) * 100, 100);
            strengthBar.style.width = `${width}%`;
            
            strengthBar.className = 'strength-bar ' + (
                width < 40 ? 'weak' :
                width < 80 ? 'medium' : 'strong'
            );
        });
    });
});

