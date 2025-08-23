# 🚀 Bot Hosting Setup Guide

> **Professional configuration reference** for deploying your bot on a **VPS server** or **cloud platforms** like **Render**.  
> This guide ensures a seamless setup using the cor server** or **cloud platforms** like **Render**.  
> This guide ensures a seamless setup using the correct configuration files.

<p align="center">
  <img src="https://img.shields.io/badge/Platform-VPS%20%7C%20Render-blueviolet?style=for-the-badge&logo=server" alt="Platform" />
  <img src="https://img.shields.io/badge/Files-Config%20%7C%20Account-green?style=for-the-badge&logo=json" alt="Files" />
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge&logo=checkmarx" alt="Status" />
</p>

---

## 📁 Required Configuration Files

### 🖥️ VPS Deployment

If you're deploying your bot on a **VPS** (e.g., Ubuntu, Debian, CentOS), ensure the following files are in your project root:


📄 config.json
📄 configCommands.json
📄 account.dev.txt


☁️ Hosting on Platforms like Render

When deploying to cloud platforms such as Render, Heroku, or Railway, use the following configuration files:

📄 config.dev.json
📄 configCommands.json
📄 account.dev.txt


🔁 config.dev.json is optimized for development/CI environments with environment variables and limited file access.
