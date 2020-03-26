const Discord = require('discord.js');
const axios = require('axios');
const config = require('./config.json');
const questions = require('../questions.json');
const client = new Discord.Client();

var flow = null;
var previous_question = null;

client.once('ready', () => {
  console.log('Ready!');
  flow = null;
  previous_question = null;
});

client.on('message', message => {
	if (message.content === config.prefix + 'start') {
    message.channel.send('Starting trivia!');

    getQuestion(message.channel);
    flow = setInterval(
      function() { getQuestion(message.channel) },
      config.interval_in_seconds * 1000
    );
  }
  
  else if (message.content === config.prefix + 'stop') {
    message.channel.send('Stopping trivia.');
    clearInterval(flow);
    flow = null;
	}
});

function getQuestion (channel) {
  if (previous_question) {
    answerQuestion (channel, previous_question);
    previous_question = null;
  }
  
  const random = Math.floor(Math.random() * questions.length)
  const question = questions[random];

  sendQuestion(channel, question);
  previous_question = question;
  console.log ("Asking question: ", question);
}

function sendQuestion (c, q) {
  c.send(
`
-----
Category: *${q.category} (${q.value})*
${config.question_prefix} **${q.question.substring(1, q.question.length - 1)}**
-----
`
  );
}

function answerQuestion (c, q) {
  c.send(
`
${config.answer_prefix} *${q.answer}*
`
  );
}

function sendError (c) {
  c.send(config.question_error)
}

client.login(config.token);