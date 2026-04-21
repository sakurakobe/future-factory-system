/**
 * ============================================================================
 * API 统一导出
 * ============================================================================
 * 说明：
 *   将所有 API 模块统一导出，方便其他地方统一 import。
 *
 * 使用方式：
 *   import { getCategories, listAnswers, updateAnswer, ... } from '../api'
 *
 * 包含模块：
 *   - client: Axios 实例
 *   - categories: 分类树接口
 *   - projects: 项目CRUD接口
 *   - answers: 访谈回答接口
 *   - reports: 报告生成/下载报告接口
 * ============================================================================
 */
export { default as client } from './client'
export * from './categories'
export * from './projects'
export * from './answers'
export * from './reports'
export * from './questions'
