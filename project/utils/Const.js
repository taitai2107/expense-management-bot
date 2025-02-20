const CALLBACK_KEYS = {
    ACCOUNT_REGISTER: "register",
    ACCOUNT_DELETE: "delete_account",
    YES_DELETE: "yes_delete",
    NO_DELETE: "no_delete",
    TRANSACTION_MENU: "thu_chi",
    IMPORT_EXCEL: "import_exel",
    SET_BUDGET: "set_budget",
    DEL_BUDGET: "del_budget",
    REPORT_MENU: "report",
    GET_ALL_REPORT: "get_all_report",
    MONTH_REPORT: "month_report",
    DEL_RP_BY_ID: "del_report_id",
    EXPORT_EXCEL: "export_exel_report",
    REPORT_BY_CATEGORY: "report_by_category",
    HELP: "help",
    DEFAULT: "default",
};
const typeBudget = [
    'budget_an_uong',
    'budget_giai_tri',
    'budget_di_lai',
    'budget_khac',
]
const categories = [
    'category_di_lai',
    'category_an_uong',
    'category_giai_tri',
    'category_khac',
    "category_luong"
];
module.exports = {CALLBACK_KEYS,typeBudget,categories}