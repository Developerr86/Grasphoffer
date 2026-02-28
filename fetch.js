const https = require('https');
const fs = require('fs');

const url = 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzlmNjc0YWQyMjYyOTQzMWI5MDg0MzI0NjQ3MWQ1YTIyEgsSBxD3vLqg1REYAZIBIwoKcHJvamVjdF9pZBIVQhMxOTg2NDYxODI2MDYwMzc5MTQ5&filename=&opi=89354086';

https.get(url, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        fs.writeFileSync('temp_dashboard.html', body);
        console.log('done');
    });
}).on('error', (e) => {
    console.error(e);
});
