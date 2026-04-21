/**
 * ============================================================================
 * API 客户端 - 项目管理
 * ============================================================================
 */
import client from './client'
import type { Project, ProjectCreate } from '../types/project'

/**
 * 获取所有评估项目列表
 * @returns 项目列表（按创建时间倒序）
 */
export const listProjects = () =>
  client.get<Project[]>('/projects')

/**
 * 创建新的评估项目
 * @param data - 项目信息（企业名称、类型、日期等）
 * @returns 创建成功的项目对象（含自动生成的ID）
 */
export const createProject = (data: ProjectCreate) =>
  client.post<Project>('/projects', data)

/**
 * 获取单个项目详情
 * @param id - 项目ID
 * @returns 项目对象
 */
export const getProject = (id: number) =>
  client.get<Project>(`/projects/${id}`)

/**
 * 更新项目信息
 * @param id - 项目ID
 * @param data - 要更新的字段（部分更新）
 * @returns 更新后的项目对象
 */
export const updateProject = (id: number, data: Partial<ProjectCreate>) =>
  client.put<Project>(`/projects/${id}`, data)

/**
 * 删除项目（不可恢复！）
 * @param id - 项目ID
 */
export const deleteProject = (id: number) =>
  client.delete(`/projects/${id}`)
