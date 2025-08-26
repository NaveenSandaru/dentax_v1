import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const sendHelloWorldWhatsApp = async (phone) => {
    try {
        const response = await axios.post(
            `${WHATSAPP_API_URL}`,
            {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: 'hello_world',
                    language: { code: 'en_US' }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('WhatsApp default template sent:', response.data);
    } catch (err) {
        console.error('WhatsApp API error:', err.response?.data || err.message);
    }
};

const sendAppointmentConfirmationWhatsApp = async (phone, date, time) => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: 'appointment_confirmation',
                    language: {
                        code: 'en_US'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: date },
                                { type: 'text', text: time }
                            ]
                        }
                    ]
                }
            }, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    }
    catch (err) {
        if (err.response) {
            const errorCode = err.response.data?.error?.code;
            const errorMsg = err.response.data?.error?.message;

            // Example: WhatsApp API returns 131047 for invalid phone numbers
            if (errorCode === 131047) {
                console.warn(`Invalid phone number: ${phone}`);
            } else {
                console.error('WhatsApp API error:', errorCode, errorMsg);
            }
        } else {
            console.error('Error sending WhatsApp message:', err.message);
        }
    }
};

const sendtempAppointmentWhatsApp = async (phone, date, time) => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: 'Appointment_Notice',
                    language: {
                        code: 'en_US'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: date },
                                { type: 'text', text: time }
                            ]
                        }
                    ]
                }
            }, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    }
    catch (err) {
        if (err.response) {
            const errorCode = err.response.data?.error?.code;
            const errorMsg = err.response.data?.error?.message;

            // Example: WhatsApp API returns 131047 for invalid phone numbers
            if (errorCode === 131047) {
                console.warn(`Invalid phone number: ${phone}`);
            } else {
                console.error('WhatsApp API error:', errorCode, errorMsg);
            }
        } else {
            console.error('Error sending WhatsApp message:', err.message);
        }
    }
};

const sendAppointmentCancellationWhatsApp = async (phone, date, time, provider, reason = '') => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: 'appointment_cancellation',
                    language: {
                        code: 'en_US'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: provider },
                                { type: 'text', text: date },
                                { type: 'text', text: time },
                                { type: 'text', text: reason || '-' }
                            ]
                        }
                    ]
                }
            }, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    }
    catch (err) {
        if (err.response) {
            const errorCode = err.response.data?.error?.code;
            const errorMsg = err.response.data?.error?.message;

            // Example: WhatsApp API returns 131047 for invalid phone numbers
            if (errorCode === 131047) {
                console.warn(`Invalid phone number: ${phone}`);
            } else {
                console.error('WhatsApp API error:', errorCode, errorMsg);
            }
        } else {
            console.error('Error sending WhatsApp message:', err.message);
        }
    }
};

const sendAppointmentRescheduleWhatsApp = async (phone, pastDate, pastTime, doctorName, newDate, newTime) => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: 'appointment_reschedule',
                    language: {
                        code: 'en_US'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: doctorName },
                                { type: 'text', text: pastTime },
                                { type: 'text', text: pastDate },
                                { type: 'text', text: newDate },
                                { type: 'text', text: newTime }
                            ]
                        }
                    ]
                }
            }, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    }
    catch (err) {
        if (err.response) {
            const errorCode = err.response.data?.error?.code;
            const errorMsg = err.response.data?.error?.message;

            // Example: WhatsApp API returns 131047 for invalid phone numbers
            if (errorCode === 131047) {
                console.warn(`Invalid phone number: ${phone}`);
            } else {
                console.error('WhatsApp API error:', errorCode, errorMsg);
            }
        } else {
            console.error('Error sending WhatsApp message:', err.message);
        }
    }
};

const sendReminderWhatsApp = async (phone, date, time, dentistName) => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: 'reminder',
                    language: {
                        code: 'en_US'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: date },
                                { type: 'text', text: time },
                                { type: 'text', text: dentistName }
                            ]
                        }
                    ]
                }
            }, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    }
    catch (err) {
        if (err.response) {
            const errorCode = err.response.data?.error?.code;
            const errorMsg = err.response.data?.error?.message;

            // Example: WhatsApp API returns 131047 for invalid phone numbers
            if (errorCode === 131047) {
                console.warn(`Invalid phone number: ${phone}`);
            } else {
                console.error('WhatsApp API error:', errorCode, errorMsg);
            }
        } else {
            console.error('Error sending WhatsApp message:', err.message);
        }
    }
};

const sendAccountCreationNoticeWhatsApp = async (phone, ID) => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: 'account_creation',
                    language: {
                        code: 'en_US'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: ID },
                            ]
                        }
                    ]
                }
            }, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    }
    catch (err) {
        if (err.response) {
            const errorCode = err.response.data?.error?.code;
            const errorMsg = err.response.data?.error?.message;

            // Example: WhatsApp API returns 131047 for invalid phone numbers
            if (errorCode === 131047) {
                console.warn(`Invalid phone number: ${phone}`);
            } else {
                console.error('WhatsApp API error:', errorCode, errorMsg);
            }
        } else {
            console.error('Error sending WhatsApp message:', err.message);
        }
    }
}

const sendMedicalImageAddedNoticeWhatsApp = async (phone, date, patientName) => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: 'medical_image_added',
                    language: {
                        code: 'en_US'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: patientName },
                                { type: 'text', text: date }
                            ]
                        }
                    ]
                }
            }, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    }
    catch (err) {
        if (err.response) {
            const errorCode = err.response.data?.error?.code;
            const errorMsg = err.response.data?.error?.message;

            // Example: WhatsApp API returns 131047 for invalid phone numbers
            if (errorCode === 131047) {
                console.warn(`Invalid phone number: ${phone}`);
            } else {
                console.error('WhatsApp API error:', errorCode, errorMsg);
            }
        } else {
            console.error('Error sending WhatsApp message:', err.message);
        }
    }
}

const sendMedicalReportAddedNoticeWhatsApp = async (phone, date, patientName) => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: 'medical_report_added',
                    language: {
                        code: 'en_US'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: patientName },
                                { type: 'text', text: date }
                            ]
                        }
                    ]
                }
            }, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    }
    catch (err) {
        if (err.response) {
            const errorCode = err.response.data?.error?.code;
            const errorMsg = err.response.data?.error?.message;

            // Example: WhatsApp API returns 131047 for invalid phone numbers
            if (errorCode === 131047) {
                console.warn(`Invalid phone number: ${phone}`);
            } else {
                console.error('WhatsApp API error:', errorCode, errorMsg);
            }
        } else {
            console.error('Error sending WhatsApp message:', err.message);
        }
    }
}

const sendMedicalImageAndReportAddedNoticeWhatsApp = async (phone, date, patientName) => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: 'medical_report_and_report_added',
                    language: {
                        code: 'en_US'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: patientName },
                                { type: 'text', text: date }
                            ]
                        }
                    ]
                }
            }, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    }
    catch (err) {
        if (err.response) {
            const errorCode = err.response.data?.error?.code;
            const errorMsg = err.response.data?.error?.message;

            // Example: WhatsApp API returns 131047 for invalid phone numbers
            if (errorCode === 131047) {
                console.warn(`Invalid phone number: ${phone}`);
            } else {
                console.error('WhatsApp API error:', errorCode, errorMsg);
            }
        } else {
            console.error('Error sending WhatsApp message:', err.message);
        }
    }
}

export {
    sendHelloWorldWhatsApp,
    sendAppointmentConfirmationWhatsApp,
    sendtempAppointmentWhatsApp,
    sendAppointmentCancellationWhatsApp,
    sendAppointmentRescheduleWhatsApp,
    sendReminderWhatsApp,
    sendAccountCreationNoticeWhatsApp,
    sendMedicalImageAddedNoticeWhatsApp,
    sendMedicalReportAddedNoticeWhatsApp,
    sendMedicalImageAndReportAddedNoticeWhatsApp
};
