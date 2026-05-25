const { WebClient } = require('@slack/web-api');

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Post a message to a channel
async function postMessage(channel, text, blocks = null) {
  return slack.chat.postMessage({
    channel,
    text,
    ...(blocks && { blocks }),
    unfurl_links: false
  });
}

// Post a rich incident brief with Block Kit
async function postIncidentBrief(channel, incident, aiSummary) {
  const severityEmoji = { P1: '🔴', P2: '🟠', P3: '🟡', P4: '🟢' };
  const emoji = severityEmoji[incident.severity] || '⚪';

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${emoji} Incident Brief: ${incident.title}` }
    },
    { type: 'divider' },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Severity:*\n${incident.severity}` },
        { type: 'mrkdwn', text: `*Status:*\n${incident.status}` },
        { type: 'mrkdwn', text: `*Service:*\n${incident.service_name}` },
        { type: 'mrkdwn', text: `*Created:*\n${new Date(incident.created_at).toUTCString()}` }
      ]
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*🤖 AI Analysis:*\n${aiSummary}` }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '🔗 View in PagerDuty' },
          url: incident.html_url,
          style: 'danger'
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '📋 Open Linear Issue' },
          action_id: 'create_linear_issue',
          value: incident.id
        }
      ]
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `Posted by Navigator Bot • ${new Date().toUTCString()}` }
      ]
    }
  ];

  return slack.chat.postMessage({ channel, text: `Incident: ${incident.title}`, blocks });
}

// Get recent messages from a channel
async function getChannelMessages(channelId, oldest, latest, limit = 50) {
  const { messages } = await slack.conversations.history({
    channel: channelId,
    oldest: String(Math.floor(new Date(oldest).getTime() / 1000)),
    latest: String(Math.floor(new Date(latest).getTime() / 1000)),
    limit
  });
  return messages;
}

// Find channel by name
async function findChannel(name) {
  const { channels } = await slack.conversations.list({ types: 'public_channel,private_channel' });
  return channels.find(c => c.name === name.replace('#', ''));
}

// Get thread replies
async function getThreadReplies(channel, threadTs) {
  const { messages } = await slack.conversations.replies({ channel, ts: threadTs });
  return messages;
}

module.exports = {
  postMessage,
  postIncidentBrief,
  getChannelMessages,
  findChannel,
  getThreadReplies
};