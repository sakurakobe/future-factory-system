"""
================================================================================
诊断评估报告生成器 (DOCX)
================================================================================
功能：
    根据项目的评估数据，自动生成符合标准格式的 Word 诊断报告。

报告结构（按示例模板生成）：
    1. 标题：{企业名称}未来工厂建设诊断评估报告
    2. 整体情况（概述）：
       - 评估背景说明
       - 现场调研说明
       - 总体评分（总分、满分、得分率）
       - 得分汇总表（方面 + 子类 + 满分 + 得分）
    3. 要求细项（详细分析）：
       - 按方面 → 子类 → 细项展开
       - 每子类包含：要求解读、企业现状与差距、详细评测表格
       - 评测表格列：能力域、评测题目、企业现状与差距、对应分值、
         对标未来工厂建议的提升点、目标分值
    4. 改造投入建议：
       - 按类别分组（必要投入/建议投入/待优化/已明确）
       - 投资项目汇总表

使用方式：
    generator = ReportGenerator(project, db)
    generator.generate("output.docx")

依赖：
    python-docx 库，用于 Word 文档的创建和格式化
================================================================================
"""
import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from models.category import MajorCategory, SubCategory, SubSubCategory
from models.question import Question
from models.answer import AssessmentAnswer
from models.note import MajorCategoryNote
from models.investment import InvestmentItem
from models.supplementary import SupplementaryInfo
from config import UPLOAD_DIR

# 等级顺序，用于计算改进建议时判断等级间的过渡
LEVEL_ORDER = ['A', 'B', 'C', 'D', 'E', 'F']


class ReportGenerator:
    """
    诊断评估报告生成器。

    使用 python-docx 按标准模板逐段生成 Word 文档。
    包含标题、概述、详细分析和投资计划四大章节。
    """

    def __init__(self, project, db: Session):
        """
        初始化报告生成器。

        参数：
            project: 评估项目 ORM 对象（包含企业名称、日期等信息）
            db: SQLAlchemy 数据库会话，用于查询回答和题目数据
        """
        self.project = project
        self.db = db
        self.doc = Document()
        self._setup_styles()
        # 获取项目的 company_type，用于过滤 离散/流程 行业题目
        self.company_type = project.company_type or "通用"

    def _should_show_question(self, question) -> bool:
        """判断题目是否应计入报告（与 categories API 保持一致）"""
        if self.company_type == "通用":
            return True
        title = question.title
        if self.company_type == "离散":
            return "流程行业：" not in title
        if self.company_type == "流程":
            return "离散行业：" not in title
        return True

    def _setup_styles(self):
        """设置文档默认样式（字体、字号）"""
        style = self.doc.styles['Normal']
        font = style.font
        font.name = '宋体'
        font.size = Pt(12)
        # 设置中文字体（确保 Word 正确渲染）
        style.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

    def _set_cell_font(self, cell, text, bold=False, size=10):
        """
        设置表格单元格的字体（支持中文字体）。

        参数：
            cell: python-docx 表格单元格对象
            text: 单元格显示文本
            bold: 是否加粗
            size: 字号（默认10pt）
        """
        cell.text = ''
        p = cell.paragraphs[0]
        run = p.add_run(text)
        run.font.size = Pt(size)
        run.font.name = '宋体'
        run.font.bold = bold
        run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

    def generate(self, filepath: str):
        """
        生成完整诊断报告并保存到指定路径。

        参数：
            filepath: 输出文件路径（如 "uploads/报告_xxx.docx"）

        返回：
            保存的文件路径
        """
        self._add_title()
        self._add_overview()
        self._add_detailed_analysis()
        self._add_investment_plan()
        self.doc.save(filepath)
        return filepath

    def _add_title(self):
        """添加报告标题（居中显示）"""
        self.doc.add_paragraph(
            f'{self.project.company_name}未来工厂建设诊断评估报告',
            style='Heading 1'
        ).alignment = WD_ALIGN_PARAGRAPH.CENTER

    def _add_overview(self):
        """
        添加"整体情况"章节。

        包含：
        - 评估背景说明（引用浙江省未来工厂建设标准）
        - 现场调研说明（评估时间、人员）
        - 总体评分（总分、满分、得分率）
        - 得分汇总表（方面 + 子类的满分和得分）
        """
        self.doc.add_heading('整体情况', level=1)

        # ---- 背景说明 ----
        self.doc.add_paragraph(
            '根据《"未来工厂"建设导则》、《浙江省"未来工厂"建设要求（试行）》，'
            '围绕未来工厂认定的企业范围、未来发展战略，以人工智能和新一代信息技术应用为手段，'
            '围绕数据要素和模型驱动，对企业的建设要求、资源要素要求、组织动态能力，'
            '以及追踪价值创造和产业链竞争力的实际 manufacturing 模式和产业组织单元数据化水平进行分析。'
            '2026年4月，我们受企业邀请，对浙江省内的未来工厂培育企业开展全面的诊断评估工作。'
        )

        # ---- 调研说明 ----
        assessors = self.project.assessors or '评估专家组'
        start = self.project.assessment_start_date or '——'
        end = self.project.assessment_end_date or '——'
        self.doc.add_paragraph(
            f'现场调研期间（{start}至{end}），由{assessors}组成的诊断评估组'
            f'围绕企业总体架构、基础支撑、应用场景等主要方面，开展全面的诊断评估工作，'
            f'系统梳理企业未来工厂发展的实际水平、发展规划，'
            f'诊断未来工厂建设的问题，对未来工厂建设提出专业指导建议。'
        )

        # ---- 总体评分（根据 company_type 过滤题目）----
        answers = self.db.query(AssessmentAnswer).filter(
            AssessmentAnswer.project_id == self.project.id
        ).all()

        total_score = 0
        total_max = 0
        for a in answers:
            question = self.db.query(Question).filter(Question.id == a.question_id).first()
            if not question or not self._should_show_question(question):
                continue
            if a.score:
                total_score += a.score
            total_max += question.max_score

        percentage = (total_score / total_max * 100) if total_max > 0 else 0

        self.doc.add_paragraph(
            f'综合调研情况，{self.project.company_name}初步得分为{total_score:.2f}分'
            f'（满分{total_max}分），得分率{percentage:.2f}%。'
        )

        # ---- 得分汇总表 ----
        majors = self.db.query(MajorCategory).order_by(MajorCategory.sort_order).all()
        subs = self.db.query(SubCategory).order_by(SubCategory.sort_order).all()

        # 构建回答映射（question_id → answer）
        answer_map = {}
        for a in answers:
            answer_map[a.question_id] = a

        # 创建表格
        table = self.doc.add_table(rows=1, cols=4, style='Light Grid Accent 1')
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        headers = ['主要方面', '子类', '满分', '得分']
        for i, h in enumerate(headers):
            self._set_cell_font(table.rows[0].cells[i], h, bold=True)

        # 逐行填充：每个子类一行，方面名只在第一个子类行显示
        for major in majors:
            major_subs = [s for s in subs if s.major_category_id == major.id]
            first = True
            for sub in major_subs:
                sub_score = 0
                sub_max = 0
                subsubs = self.db.query(SubSubCategory).filter(
                    SubSubCategory.sub_category_id == sub.id
                ).all()
                for ss in subsubs:
                    questions = self.db.query(Question).filter(
                        Question.sub_sub_category_id == ss.id
                    ).all()
                    for q in questions:
                        if not self._should_show_question(q):
                            continue
                        sub_max += q.max_score
                        if q.id in answer_map and answer_map[q.id].score:
                            sub_score += answer_map[q.id].score

                row = table.add_row()
                if first:
                    self._set_cell_font(row.cells[0], major.name, bold=True)
                    first = False
                self._set_cell_font(row.cells[1], sub.name)
                self._set_cell_font(row.cells[2], f'{sub.max_score}')
                self._set_cell_font(row.cells[3], f'{sub_score:.2f}')

        self.doc.add_paragraph('')

    def _add_detailed_analysis(self):
        """
        添加"要求细项"章节。

        按 方面 → 子类 层级展开，每个子类包含：
        - 子类标题 + 得分概况
        - 要求解读
        - 企业现状与差距
        - 详细评测表格（6列）
        """
        self.doc.add_heading('要求细项', level=1)

        majors = self.db.query(MajorCategory).order_by(MajorCategory.sort_order).all()
        answers = self.db.query(AssessmentAnswer).filter(
            AssessmentAnswer.project_id == self.project.id
        ).all()
        answer_map = {a.question_id: a for a in answers}

        for major in majors:
            self.doc.add_heading(major.name, level=2)

            major_score = 0
            major_max = 0
            subs = self.db.query(SubCategory).filter(
                SubCategory.major_category_id == major.id
            ).order_by(SubCategory.sort_order).all()

            for sub in subs:
                sub_score = 0
                sub_max = 0
                subsubs = self.db.query(SubSubCategory).filter(
                    SubSubCategory.sub_category_id == sub.id
                ).all()
                for ss in subsubs:
                    questions = self.db.query(Question).filter(
                        Question.sub_sub_category_id == ss.id
                    ).all()
                    for q in questions:
                        if not self._should_show_question(q):
                            continue
                        sub_max += q.max_score
                        if q.id in answer_map and answer_map[q.id].score:
                            sub_score += answer_map[q.id].score
                major_score += sub_score
                major_max += sub_max

                # 子类标题
                self.doc.add_heading(sub.name, level=3)

                # 子类得分概况
                pct = (sub_score / sub.max_score * 100) if sub.max_score > 0 else 0
                self.doc.add_paragraph(
                    f'{sub.name}（总分{sub.max_score}分，当前得分{sub_score:.2f}分，得分率{pct:.2f}%）'
                )

                # 要求解读
                self.doc.add_paragraph(f'要求解读：{sub.description or ""}')

                # 企业现状与差距：汇总所有题目的企业现状/沟通内容
                status_parts = []
                for ss in subsubs:
                    questions = self.db.query(Question).filter(
                        Question.sub_sub_category_id == ss.id
                    ).order_by(Question.sort_order).all()
                    for q in questions:
                        if not self._should_show_question(q):
                            continue
                        if q.id in answer_map:
                            a = answer_map[q.id]
                            if a.company_status:
                                status_parts.append(f'{q.title}：{a.company_status}')
                            elif a.communication_content:
                                status_parts.append(f'{q.title}：{a.communication_content}')

                if status_parts:
                    self.doc.add_paragraph(f'企业现状与差距：{"；".join(status_parts)}')
                else:
                    self.doc.add_paragraph('企业现状与差距：暂无记录。')

                # 添加详细评测表格
                self._add_detail_table(sub, answer_map)

    def _add_detail_table(self, sub_category, answer_map):
        """
        为指定子类添加详细评测表格。

        表格包含6列：
        1. 能力域（细项名称）
        2. 评测题目
        3. 企业现状与差距
        4. 对应分值（当前得分）
        5. 对标未来工厂建议的提升点（改进建议）
        6. 目标分值
        """
        subsubs = self.db.query(SubSubCategory).filter(
            SubSubCategory.sub_category_id == sub_category.id
        ).order_by(SubSubCategory.sort_order).all()

        table = self.doc.add_table(rows=1, cols=6, style='Light Grid Accent 1')
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        headers = ['能力域', '评测题目', '企业现状与差距', '对应分值',
                   '对标未来工厂建议的提升点', '目标分值']
        for i, h in enumerate(headers):
            self._set_cell_font(table.rows[0].cells[i], h, bold=True, size=9)

        # 逐行填充题目
        for ss in subsubs:
            questions = self.db.query(Question).filter(
                Question.sub_sub_category_id == ss.id
            ).order_by(Question.sort_order).all()

            for q in questions:
                if not self._should_show_question(q):
                    continue
                row = table.add_row()
                self._set_cell_font(row.cells[0], ss.name, size=9)
                self._set_cell_font(row.cells[1], q.title, size=9)

                if q.id in answer_map:
                    a = answer_map[q.id]
                    # 企业现状/沟通内容
                    self._set_cell_font(row.cells[2],
                                        a.company_status or a.communication_content or '', size=9)
                    # 当前得分
                    self._set_cell_font(row.cells[3], f'{a.score or 0:.2f}', size=9)

                    # 改进建议：根据当前等级和目标等级之间的等级描述生成
                    suggestion = self._generate_suggestion(q, a)
                    self._set_cell_font(row.cells[4], suggestion, size=9)

                    # 目标分值
                    if a.target_level:
                        options = json.loads(q.options_json)
                        for opt in options:
                            if opt['level'] == a.target_level:
                                self._set_cell_font(row.cells[5], f'{opt["score"]:.2f}', size=9)
                                break
                    else:
                        self._set_cell_font(row.cells[5], '', size=9)
                else:
                    self._set_cell_font(row.cells[2], '', size=9)
                    self._set_cell_font(row.cells[3], '0.00', size=9)
                    self._set_cell_font(row.cells[4], '', size=9)
                    self._set_cell_font(row.cells[5], '', size=9)

    def _generate_suggestion(self, question, answer) -> str:
        """
        根据当前等级和目标等级生成改进建议。

        逻辑：提取从当前等级到目标等级之间所有等级的描述（取前80字符），
        作为企业需要达成的目标要点。

        示例：当前C级，目标E级 → 提取D级和E级的描述作为建议
        """
        if not answer.selected_level or not answer.target_level:
            return '——'
        if answer.selected_level == answer.target_level:
            return '已达目标，持续优化。'

        current_idx = LEVEL_ORDER.index(answer.selected_level) if answer.selected_level in LEVEL_ORDER else 0
        target_idx = LEVEL_ORDER.index(answer.target_level) if answer.target_level in LEVEL_ORDER else 0

        options = json.loads(question.options_json)
        suggestions = []
        for i in range(current_idx + 1, target_idx + 1):
            for opt in options:
                if opt['level'] == LEVEL_ORDER[i] and opt.get('description'):
                    # 提取关键描述（前80字符）
                    desc = opt['description'][:80]
                    suggestions.append(desc)
                    break

        return '、'.join(suggestions) if suggestions else '——'

    def _add_investment_plan(self):
        """
        添加"改造投入建议"章节。

        包含：
        1. 按类别分组的投资详情（每类标题 + 项目列表）
        2. 投资项目汇总表
        """
        self.doc.add_heading('改造投入建议', level=1)

        # 四大投资类别
        categories = {
            'necessary': '必要投入/改造项目',
            'recommended': '建议投入项目',
            'system_upgrade': '系统已有待优化项目',
            'confirmed': '已明确投入项目',
        }

        # 逐类展示投资项目
        for cat_key, cat_title in categories.items():
            self.doc.add_heading(cat_title, level=2)
            items = self.db.query(InvestmentItem).filter(
                InvestmentItem.project_id == self.project.id,
                InvestmentItem.category == cat_key
            ).order_by(InvestmentItem.sort_order).all()

            if not items:
                self.doc.add_paragraph('暂无投资项目。')
                continue

            for i, item in enumerate(items, 1):
                budget_str = ''
                if item.budget_max and item.budget_min:
                    budget_str = f'（投入预算：{item.budget_min}-{item.budget_max}万元）'
                elif item.budget_min:
                    budget_str = f'（投入预算：{item.budget_min}万元）'

                p = self.doc.add_paragraph()
                p.add_run(f'{i}、{item.title}{budget_str}').bold = True

                if item.description:
                    self.doc.add_paragraph(item.description)

        # ---- 投资项目汇总表 ----
        all_items = self.db.query(InvestmentItem).filter(
            InvestmentItem.project_id == self.project.id
        ).order_by(InvestmentItem.sort_order).all()

        if all_items:
            self.doc.add_paragraph('')
            self.doc.add_heading('投资项目汇总表', level=2)
            table = self.doc.add_table(rows=1, cols=5, style='Light Grid Accent 1')
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            headers = ['序号', '类别', '项目名称', '说明', '预算（万元）']
            for i, h in enumerate(headers):
                self._set_cell_font(table.rows[0].cells[i], h, bold=True, size=9)

            idx = 1
            for item in all_items:
                row = table.add_row()
                self._set_cell_font(row.cells[0], str(idx), size=9)
                self._set_cell_font(row.cells[1], item.category, size=9)
                self._set_cell_font(row.cells[2], item.title, size=9)
                self._set_cell_font(row.cells[3], item.description or '', size=9)
                budget = ''
                if item.budget_max and item.budget_min:
                    budget = f'{item.budget_min}-{item.budget_max}'
                elif item.budget_min:
                    budget = str(item.budget_min)
                self._set_cell_font(row.cells[4], budget, size=9)
                idx += 1
