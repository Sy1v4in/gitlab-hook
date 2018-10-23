# gitlab-hook

Web app that receives [events](https://docs.gitlab.com/ce/user/project/integrations/webhooks.html#events) from Gitlab, and sends Slack notifications
(private messages).

This app uses 4 environment variables for the tools credentials:
  - `GITLAB_API_URL` and `GITLAB_API_KEY` for gitlab
  - `SLACK_WEBHOOK_URL` and `SLACK_API_TOKEN` for slack
