/**
 * 配置存储工具
 * 负责将配置保存到文件和从文件加载配置
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, '../../config.json');

/**
 * 加载配置
 * @returns {Promise<Object|null>} 配置对象，如果文件不存在则返回 null
 */
export async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 文件不存在，返回 null
      return null;
    }
    console.error('加载配置失败:', error.message);
    return null;
  }
}

/**
 * 保存配置
 * @param {Object} config - 配置对象
 * @returns {Promise<boolean>} 是否保存成功
 */
export async function saveConfig(config) {
  try {
    // 确保目录存在
    const configDir = path.dirname(CONFIG_FILE);
    await fs.mkdir(configDir, { recursive: true });
    
    // 保存配置到文件
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('保存配置失败:', error.message);
    return false;
  }
}

/**
 * 删除配置文件
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteConfig() {
  try {
    await fs.unlink(CONFIG_FILE);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 文件不存在，视为成功
      return true;
    }
    console.error('删除配置失败:', error.message);
    return false;
  }
}

/**
 * 获取配置文件路径
 * @returns {string} 配置文件路径
 */
export function getConfigPath() {
  return CONFIG_FILE;
}
