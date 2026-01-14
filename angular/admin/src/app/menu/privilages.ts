export interface PrivilagesData {
	alias?: string;
	icon?: string;
	name: string;
	url: string;
	children?: PrivilagesData[];
	status?: { add?: boolean, edit?: boolean, view?: boolean, delete?: boolean, export?: boolean, bulk?: boolean };
}

export const privilagedata: PrivilagesData[] = [
	{
		alias: "Dashboard",
		name: 'Dashboard',
		url: '/app/dashboard',
		icon: 'assets/new_images/sidebar/dashboard.png',
		status: { view: false }
	},
	{
		alias: "operations",
		name: 'Operations',
		url: '/app/operations',
		icon: 'assets/new_images/sidebar/operations.png',
		status: { add: false, edit: false, view: false, delete: false },
		children: [
			{ name: 'Contracts', url: '/app/contracts', icon: 'assets/new_images/sidebar/contract.png' },
			{ name: 'Vendors', url: '/app/tags', icon: 'assets/new_images/sidebar/vendor.png' }
		]
	},
	{
		alias: "resources",
		name: 'Resources',
		url: '/app/resources',
		icon: 'assets/new_images/sidebar/resource.png',
		status: { add: false, edit: false, view: false, delete: false },
		children: [
			{ name: 'Employees', url: '/app/employees', icon: 'assets/new_images/sidebar/employee.png' },
			{ name: 'Fleet', url: '/app/testimonial', icon: 'assets/new_images/sidebar/fleet.png' }
		]
	},
	{
		alias: "finance",
		name: 'Finance',
		url: '/app/finance',
		icon: 'assets/new_images/sidebar/finance.png',
		status: { add: false, edit: false, view: false, delete: false },
		children: [
			{ name: 'Invoice', url: '/app/invoice', icon: 'assets/new_images/sidebar/invoice.png' }
		]
	},
	{
		alias: "support",
		name: 'Support',
		url: '/app/support',
		icon: 'assets/new_images/sidebar/support.png',
		status: { add: false, edit: false, view: false, delete: false },
		children: [
			{ name: 'Spare parts', url: '/app/spare-parts', icon: 'assets/new_images/sidebar/spare_parts.png' },
			{ name: 'Maintenance', url: '/app/maintenance/maintenance-list', icon: 'assets/new_images/sidebar/maintanance.png' }
		]
	},
	{
		alias: "administrator",
		name: 'Administrators',
		url: '/app/administrator',
		icon: 'assets/new_images/sidebar/administrator.png',
		status: { add: false, edit: false, view: false, delete: false },
		children: [
			{ name: 'Admin List', url: '/app/administrator/list', icon: '' },
			{ name: 'Sub Admin List', url: '/app/administrator/sub-admin-list', icon: '' }
		]
	},
	{
		alias: "reports",
		name: 'Reports',
		url: '/app/report/reported-list',
		icon: 'assets/new_images/sidebar/report.png',
		status: { view: false }
	},
	{
		alias: "fuel-records",
		name: 'Fuel Records',
		url: '/app/fuel-records/fuel-records-list',
		icon: 'assets/new_images/sidebar/fuel_report.png',
		status: { view: false }
	},
	{
		alias: "performance-analysis",
		name: 'Performance Analysis',
		url: '/app/performance-analysis/peroformance-analysis-list',
		icon: 'assets/new_images/sidebar/performance_analysis.png',
		status: { view: false }
	},
	{
		alias: "settings",
		name: 'Settings',
		url: '/app/settings',
		icon: 'assets/new_images/sidebar/settings.png',
		status: { view: false, edit: false },
		children: [
			{ name: 'General Settings', url: '/app/settings/gentralsetting', icon: '' }
		]
	}
];

export default privilagedata;