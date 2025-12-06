require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:4200'
}));
app.use(bodyParser.json());

// SAP Configuration
const SAP_BASE_URL = process.env.SAP_BASE_URL;
const SAP_BASIC_AUTH = process.env.SAP_BASIC;

const axiosInstance = axios.create({
    baseURL: SAP_BASE_URL,
    headers: {
        'Authorization': `Basic ${SAP_BASIC_AUTH}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// SMTP Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { employeeId, passcode } = req.body;
    try {
        const url = `/sap/opu/odata/sap/ZEMPLOYEE_829_OD_SRV_01/ZEMP_LOGIN_829Set(EmployeeId='${encodeURIComponent(employeeId)}',Passcode='${encodeURIComponent(passcode)}')?$format=json`;
        console.log('Login URL:', url);
        const response = await axiosInstance.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Login Error:', error.message);
        if (error.response) {
            console.error('SAP Response Status:', error.response.status);
            console.error('SAP Response Data:', JSON.stringify(error.response.data));
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error('No response from SAP or other error');
            res.status(500).json({ error: 'Login failed', details: error.message });
        }
    }
});

// Leave Request Endpoint
app.get('/api/leave-request', async (req, res) => {
    const { empId } = req.query;
    try {
        const url = `/sap/opu/odata/sap/ZEMPLOYEE_829_OD_SRV_01/ZEMP_LEAVE_REQ_829Set?$filter=Empid eq '${empId}'&$format=json`;
        console.log('Leave Request URL:', url);
        const response = await axiosInstance.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Leave Request Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Failed to fetch leave requests' });
        }
    }
});

// Profile Endpoint
app.get('/api/profile', async (req, res) => {
    const { empId } = req.query;
    try {
        const url = `/sap/opu/odata/sap/ZEMPLOYEE_829_OD_SRV_01/ZEMP_Profile_829Set?$filter=Pernr eq '${empId}'&$format=json`;
        console.log('Profile URL:', url);
        const response = await axiosInstance.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Profile Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }
});

// Payslip Endpoint
app.get('/api/payslip', async (req, res) => {
    const { empId } = req.query;
    try {
        const url = `/sap/opu/odata/sap/ZEMPLOYEE_829_OD_SRV_01/ZEMP_PAYSLIP_829Set?$filter=EmpId eq '${empId}'&$format=json`;
        console.log('Payslip URL:', url);
        const response = await axiosInstance.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Payslip Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Failed to fetch payslips' });
        }
    }
});

// Payslip PDF Endpoint
app.get('/api/payslip-pdf', async (req, res) => {
    const { empId } = req.query;
    try {
        const url = `/sap/opu/odata/sap/ZEMPLOYEE_829_OD_SRV_01/ZEMP_PAYSLIP_PDF_829Set(EMPID='${empId}')/$value`;
        console.log('Payslip PDF URL:', url);
        const response = await axiosInstance.get(url, { responseType: 'arraybuffer' });
        res.setHeader('Content-Type', 'application/pdf');
        res.send(response.data);
    } catch (error) {
        console.error('Payslip PDF Error:', error.message);
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send('Failed to fetch payslip PDF');
        }
    }
});

// Send Payslip Email Endpoint
app.post('/api/send-payslip-email', async (req, res) => {
    let { empId, wageType, email } = req.body;
    // email = "smonisha2107@gmail.com"
    console.log(`Request to send payslip ${wageType} for employee ${empId} to ${email}`);

    try {
        // Fetch the PDF from SAP
        const url = `/sap/opu/odata/sap/ZEMPLOYEE_829_OD_SRV_01/ZEMP_PAYSLIP_PDF_829Set(EMPID='${empId}')/$value`;
        console.log('Fetching PDF for email attachment:', url);
        const pdfResponse = await axiosInstance.get(url, { responseType: 'arraybuffer' });

        // Send Email
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: email,
            subject: `Payslip for ${wageType}`,
            text: `Please find attached your payslip for the period ${wageType}.`,
            attachments: [
                {
                    filename: `Payslip_${wageType}.pdf`,
                    content: pdfResponse.data
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email successfully sent to ${email}`);
        res.json({ message: `Payslip sent successfully to ${email}` });
    } catch (error) {
        console.error('Send Email Error:', error.message);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (e) => {
    console.error('Server error:', e);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
});
