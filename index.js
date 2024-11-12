const express = require('express');
const { Groq } = require('groq-sdk');  // Đảm bảo bạn đã cài đặt groq-sdk
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,  // Lấy API Key từ biến môi trường
    baseURL: "https://api.groq.com"  // Đặt baseURL cho Groq
});

const textGeneration = async (prompt) => {
    try {
        const response = await groq.chat.completions.create({
            model: 'mixtral-8x7b-32768',  // Model của Groq
            messages: [
                { role: "user", content: prompt }
            ],
            temperature: 0.9,
            max_tokens: 500,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0.6,
            stop: ['Human:', 'AI:']
        });

        return {
            status: 1,
            response: response.choices[0].message.content  // Lấy phản hồi từ Groq
        };
    } catch (error) {
        console.error("Error from Groq:", error.response ? error.response.data : error.message);
        return {
            status: 0,
            response: 'Sorry, I\'m not able to help with that.'
        };
    }
};

const webApp = express();
const PORT = process.env.PORT || 5000;

webApp.use(express.urlencoded({ extended: true }));
webApp.use(express.json());
webApp.use((req, res, next) => {
    console.log(`Path ${req.path} with Method ${req.method}`);
    next();
});

webApp.get('/', (req, res) => {
    res.sendStatus(200);
});

webApp.post('/dialogflow', async (req, res) => {
    let action = req.body.queryResult.action;
    let queryText = req.body.queryResult.queryText;

    if (action === 'input.unknown') {
        let result = await textGeneration(queryText);
        if (result.status == 1) {
            res.send({
                fulfillmentText: result.response
            });
        } else {
            res.send({
                fulfillmentText: `Sorry, I'm not able to help with that.`
            });
        }
    } else {
        res.send({
            fulfillmentText: `No handler for the action ${action}.`
        });
    }
});

webApp.listen(PORT, () => {
    console.log(`Server is up and running at ${PORT}`);
});
