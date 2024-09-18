//Handle contact form submission

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
    // Set up your email service configuration
    service: 'gmail',
    auth: {
        user: 'devinlatham20@gmail.com',
        pass: 'matrix123'
    }
  });
  
  // Get form fields and send email
  const submitButton = document.getElementById('submitButton');
  submitButton.addEventListener('click', function () {
    const name = document.getElementById('name').value;
    const subject = document.getElementById('subject').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('msg').value;
  
    // Construct email
    const mailOptions = {
        from: email,
        to: 'devinlatham20@gmail@example.com',
        subject: subject,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    };
  
    // Send email
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
            // Clear form fields after successful submission
            document.getElementById('name').value = '';
            document.getElementById('subject').value = '';
            document.getElementById('email').value = '';
            document.getElementById('msg').value = '';
        }
    });
  });

 
  