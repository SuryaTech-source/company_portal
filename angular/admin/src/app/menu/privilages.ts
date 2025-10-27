export interface PrivilagesData {
	alias?: string;
	icon?: string;
	name: string;
	url: string;
	children?: PrivilagesData[];
	status?: { add?: boolean, edit?: boolean, view?: boolean, delete?: boolean, export?: boolean, bulk?: boolean };
}
const data: PrivilagesData[] = [
	// {
	// 	alias : "dashboard",
	// 	name: 'Dashboard',
	// 	url: '/app/dashboard',
	// 	icon: 'fa fa-tachometer',
	// 	status: {
	// 		add: true,
	// 		edit: true,
	// 		view: true,
	// 		delete: true
	// 	}
	//   },

	// category
	{
		alias: "category",
		name: 'Categories',
		url: '/app/category',
		icon: 'fa fa-lightbulb-o',
		children: [
			{
				name: 'Category List',
				url: '/app/category/category-list',
				icon: 'fa fa-list'
			},
			{
				name: 'Add Category',
				url: '/app/category/category-add',
				icon: 'fa fa-plus-circle',
			},
			{
				name: 'Sub Category List',
				url: '/app/category/sub-category-list',
				icon: 'fa fa-list'
			},
			{
				name: 'Add Sub Category',
				url: '/app/category/sub-category-add',
				icon: 'fa fa-plus-circle',
			},
		],
		status: {
			add: false,
			edit: false,
			view: false,
			delete: false,
			export: false
		}
	},
	//products
	{
		alias: "products",
		name: 'Products',
		url: '/app/products',
		icon: 'fa fa-cubes',
		children: [
			{
				name: 'Products List',
				url: '/app/products/list',
				icon: 'fa fa-th-list'
			},
			{
				name: 'Add Product',
				url: '/app/products/add',
				icon: 'fa fa-plus-circle',
			},
			{
				name: 'Attributes',
				url: '/app/units/units-list',
				icon: ''
			},
			{
				name: 'Add Attributes',
				url: '/app/units/units-add',
				icon: ''
			},
		],
		status: {
			add: false,
			edit: false,
			view: false,
			delete: false,
			export: false,
			bulk: false
		}
	},

	//atributes
	// {
	// 	alias: "attributes",
	// 	name: 'Attributes',
	// 	url: '/app/units/units-list',
	// 	icon: 'fa fa-cubes',
	// 	children: [
	// 		{
	// 			name: 'Attributes',
	// 			url: '/app/units/units-list',
	// 			icon: ''
	// 		},
	// 		{
	// 			name: 'Add Attributes',
	// 			url: '/app/units/units-add',
	// 			icon: ''
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		delete: false,
	// 	}
	// },
	//tag
	{
		alias: "tags",
		name: 'Tags',
		url: '/app/tags',
		icon: 'assets/image/tag.png',
		children: [
			{
				name: 'Tag List',
				url: '/app/tags/list',
				icon: ''
			},
			{
				name: 'Add Tag',
				url: '/app/tags/add',
				icon: '',
			},

		],
		status: {
			add: false,
			edit: false,
			delete: false
		}
	},
	//deals
	{
		alias: "deals",
		name: 'Deals',
		url: '/app/deals',
		icon: 'assets/image/deal.png',
		children: [
			{
				name: 'Deal List',
				url: '/app/deals/list',
				icon: ''
			},
			{
				name: 'Add Deal',
				url: '/app/deals/add',
				icon: '',
			},

		],
		status: {
			add: false,
			edit: false,
			delete: false
		}
	},
	//orders
	{
		alias: "Orders",
		name: 'Orders',
		url: '/app/orders',
		icon: 'fa fa-tasks',
		children: [
			{
				name: 'Orders Dashboard',
				url: '/app/orders/orders-dashboard',
				icon: 'fa fa-tachometer'
			}, {
				name: 'User Cancelled Orders',
				url: '/app/orders/usercancelledorders',
				icon: 'fa fa-ban'
			},
			{
				name: 'Delivered Orders',
				url: '/app/orders/deliveredorders',
				icon: 'fa fa-check'
			},
			{
				name: 'cancel Orders',
				url: '/app/orders/cancelorders',
				icon: 'fa fa-ban'
			},
			{
				name: 'Order Pick Up',
				url: '/app/orders/orderpickup',
				icon: 'fa fa-map-pin'
			},
			{
				name: 'New Orders',
				url: '/app/orders/neworders',
				icon: 'fa fa-plus-circle'
			},
			{
				name: 'Packed Orders',
				url: '/app/orders/packedorders',
				icon: 'fa fa-cube'
			}
		],
		status: {
			edit: false,
			view: false,
			delete: false,
			export: false
		}
	},
	//customers
	{
		alias: "users",
		name: 'Customers',
		url: '/app/users',
		icon: 'assets/image/profile-2user.png',
		children: [
			{
				name: 'Customer List',
				url: '/app/users/list',
				icon: ''
			},

			{
				name: 'Add Customer',
				url: '/app/users/add',
				icon: '',
			},
			{
				name: 'Subscribe Users',
				url: '/app/users/subscribe',
				icon: ''
			}
		],
		status: {
			add: false,
			edit: false,
			view: false,
			delete: false
		}
	},
	{
		name:'operations',
		url:'/app/operations',
		icon:'assets/image/category.png',
		children:[
			{
				name:'Contracts',
				url:'/app/operations/contracts',
				icon:''

			},
			{
				name:'vendors',
				url:'/app/operations/vendors',
				icon:''
			},
		],
		status:{
			add:false,
			edit:false,
			view:false,
			delete:false
		}
	},
	// general settings
	{
		alias: "settings",
		name: 'Settings',
		url: '/app/settings/gentralsetting',
		icon: 'assets/image/profile-2user.png',
		children: [
			{
				name: 'General Settings',
				url: '/app/settings/gentralsetting',
				icon: ''
			},

			{
				name: 'SMTP',
				url: '/app/settings/smtpsetting',
				icon: ''
			},

			{
				name: 'SEO',
				url: '/app/settings/seosetting',
				icon: ''
			},

			{
				name: 'Shipping',
				url: '/app/settings/shipping',
				icon: ''
			},
		],
		status: {
			view: false,
			edit: false
		}
	},
	// // smtp settings
	// {
	// 	alias: "smtp settings",
	// 	name: 'SMTP Settings',
	// 	url: '/app/settings/smtpsetting',
	// 	icon: 'assets/image/profile-2user.png',
	// 	children: [
	// 		{
	// 			name: 'SMTP',
	// 			url: '/app/settings/smtpsetting',
	// 			icon: ''
	// 		},

	// 	],
	// 	status: {
	// 		view: false,
	// 		edit: false
	// 	}
	// },
	// // seo settings
	// {
	// 	alias: "seo settings",
	// 	name: 'seo Settings',
	// 	url: '/app/settings/seosetting',
	// 	icon: 'assets/image/profile-2user.png',
	// 	children: [
	// 		{
	// 			name: 'SEO',
	// 			url: '/app/settings/seosetting',
	// 			icon: ''
	// 		},

	// 	],
	// 	status: {
	// 		view: false,
	// 		edit: false
	// 	}
	// },
	// // seo settings
	// {
	// 	alias: "Shipping settings",
	// 	name: 'shipping Settings',
	// 	url: '/app/settings/shipping',
	// 	icon: 'assets/image/profile-2user.png',
	// 	children: [
	// 		{
	// 			name: 'Shipping',
	// 			url: '/app/settings/shipping',
	// 			icon: ''
	// 		},

	// 	],
	// 	status: {
	// 		view: false,
	// 		edit: false
	// 	}
	// },
	// coupon
	{
		alias: "Coupons",
		name: 'Coupon Management',
		url: '/app/coupon',
		icon: 'fa fa-gift',
		children: [
			{
				name: 'Coupon List',
				url: '/app/coupon/couponlist',
				icon: 'fa fa-list-ul'
			},
			{
				name: 'Coupon Add',
				url: '/app/coupon/couponadd',
				icon: 'fa fa-plus-circle'
			},
		],
		status: {
			add: false,
			edit: false,
			view: false,
			delete: false
		}
	},
	// email template
	{
		alias: "Email Template",
		name: 'Email Template',
		url: '/app/email-template',
		icon: 'fa fa-envelope-open-o',
		children: [
			{
				name: 'Template List',
				url: '/app/email-template/list',
				icon: 'fa fa-bars'
			},
			{
				name: 'Add Template',
				url: '/app/email-template/add',
				icon: 'fa fa-plus-circle',
			},
		],
		status: {
			edit: false,
			view: false,
			add: false
		}
	},
	// payment gateway
	{
		alias: "Payment Gateway",
		name: 'Payment Gateway',
		url: '/app/paymentgateway',
		icon: 'fa fa-credit-card-alt',
		status: {
			edit: false,
			view: false,
		}
	},
	// testimonial
	{
		alias: "Testimonial",
		name: 'Testimonial',
		url: '/app/testimonial',
		icon: 'assets/image/offer.png',
		children: [
			{
				name: 'Add Testimonial',
				url: '/app/testimonial/add',
				icon: ''
			},
			{
				name: 'Testimonial List',
				url: '/app/testimonial/list',
				icon: ''
			},
		],
		status: {
			add: false,
			edit: false,
			delete: false
		}
	},
	// pages
	{
		alias: "Layout Control",
		name: 'Layout Control',
		url: '/app/Pagecontrol',
		icon: 'fa fa-folder',
		children: [
			{
				name: 'Page List',
				url: '/app/pages/list',
				icon: ''
			},
			{
				name: 'FAQ Management',
				url: '/app/faq-management',
				icon: ''
			},
		],
		status: {
			edit: false,
			delete: false,
			add: true
		}
	},
	// banner list
	{

		alias: "FAQ Management",
		name: 'FAQ Management',
		url: '/app/management',
		icon: 'fa fa-credit-card-alt',
		status: {
			edit: false,
			view: false,
			delete: false,
			add: false
		}
	},
	{

		alias: "Reports",
		name: 'Reports',
		url: '/app/report',
		icon: 'fa fa-bar-chart',
		status: {
			edit: false,
			view: false,
			delete: false,
			add: false
		}
	},
	{

		alias: "Fuel Records",
		name: 'Fuel Records',
		url: '/app/fuel-records/fuel-records-list',
		icon: 'fa fa-car',
		status: {
			edit: false,
			view: false,
			delete: false,
			add: false
		}
	},
	{

		alias: "Maintenance",
		name: 'Maintenance',
		url: '/app/maintenance/maintenance-list',
		icon: 'fa fa-car',
		status: {
			edit: false,
			view: false,
			delete: false,
			add: false
		}
	},
	{

		alias: "Performance Analysis",
		name: 'Performance Analysis',
		url: '/app/performance-analysis/peroformance-analysis-list',
		icon: 'fa fa-car',
		status: {
			edit: false,
			view: false,
			delete: false,
			add: false
		}
	},
	{
		alias: "Banner",
		name: 'Banner Types',
		url: '/app/banners/banner-types-list',
		icon: 'assets/image/banner.png',
		children: [
			{
				name: 'Banner-type-lists',
				url: '/app/banners/banner-types-list',
				icon: ''
			},
			{
				name: 'Header-1',
				url: '/app/banners/header-1',
				icon: ''
			},
			{
				name: 'Header-2',
				url: '/app/banners/header-2',
				icon: ''
			},
			{
				name: 'Banner batchs',
				url: '/app/banners/batchs',
				icon: ''
			},

			{
				name: 'Post-Header-1',
				url: '/app/banners/post-header-1',
				icon: ''
			},
			{
				name: 'Post-Header-2',
				url: '/app/banners/post-header-2',
				icon: ''
			},
			{
				name: 'Post-Category-3',
				url: '/app/banners/post-category-3',
				icon: ''
			},
			{
				name: 'Post-Category-6',
				url: '/app/banners/post-category-6',
				icon: ''
			},
			{
				name: 'Pre-Footer',
				url: '/app/banners/pre-footer',
				icon: ''
			},
		],
		status: {
			edit: false,
			delete: false,
			add: false
		}
	},


	// {
	// 	alias: "Brand",
	// 	name: 'Brand',
	// 	url: '/app/brand',
	// 	icon: 'fa fa-cubes',
	// 	children: [
	// 		{
	// 			name: 'Brand List',
	// 			url: '/app/brand/brand-list',
	// 			icon: 'fa fa-th-list'
	// 		},
	// 		{
	// 			name: 'Brand Add',
	// 			url: '/app/brand/brand-add',
	// 			icon: 'fa fa-plus-circle'
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },
	// {
	// 	alias: "Banners",
	// 	name: 'Banners',
	// 	url: '/app/banners',
	// 	icon: 'fa fa-picture-o',
	// 	children: [
	// 		{
	// 			name: 'Add Banner',
	// 			url: '/app/banners/web-add',
	// 			icon: 'fa fa-plus-circle'
	// 		},
	// 		{
	// 			name: 'Banner Lists',
	// 			url: '/app/banners/web-list',
	// 			icon: 'fa fa-th-list'
	// 		},
	// 		{
	// 			name: 'Add Mobile banner',
	// 			url: '/app/banners/mobile-banner-add',
	// 			icon: 'fa fa-plus-circle'
	// 		},
	// 		{
	// 			name: 'Mobile Banner List',
	// 			url: '/app/banners/mobile-list',
	// 			icon: 'fa fa-th-list'
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },

	// {
	// 	alias: "Cancellation Reason",
	// 	name: 'Cancellation Reason',
	// 	url: '/app/cancellationreason',
	// 	icon: 'fa fa-close',
	// 	children: [
	// 		{
	// 			name: 'Cancellation Reason List',
	// 			url: '/app/cancellationreason/cancellationlist',
	// 			icon: 'fa fa-play'
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },
	// {
	// 	alias: "City Management",
	// 	name: 'City Management',
	// 	url: '/app/cityManagement',
	// 	icon: 'fa fa-industry',
	// 	children: [
	// 		{
	// 			name: 'City Dashboard',
	// 			url: '/app/cityManagement/city_dashboard',
	// 			icon: 'fa fa-tachometer'
	// 		},
	// 		{
	// 			name: 'City List',
	// 			url: '/app/cityManagement/list',
	// 			icon: 'fa fa-list-ul'
	// 		},
	// 		{
	// 			name: 'Add City',
	// 			url: '/app/cityManagement/add',
	// 			icon: 'fa fa-plus-circle'
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },

	// {
	// 	alias: "reviewsRatings",
	// 	name: 'Reviews & Ratings',
	// 	url: '/app/reviews/rating',
	// 	icon: 'fa fa-pencil-square',
	// 	children: [
	// 	  {
	// 		name: 'Reviews Ratings List',
	// 		url: '/app/reviews/rating/list',
	// 		icon: ''
	// 	  },
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	//   },
	// {
	// 	alias: "Drivers ",
	// 	name: 'Drivers',
	// 	url: '/app/drivers',
	// 	icon: 'fa fa-truck',
	// 	children: [
	// 		{
	// 			name: 'Driver dashboard',
	// 			url: '/app/drivers/driverdashboard',
	// 			icon: 'fa fa-tachometer'
	// 		},
	// 		{
	// 			name: 'Drivers List',
	// 			url: '/app/drivers/driverslist',
	// 			icon: 'fa fa-th-list'
	// 		},
	// 		{
	// 			name: 'Add Drivers',
	// 			url: '/app/drivers/adddriver',
	// 			icon: 'fa fa-plus-circle'
	// 		},
	// 		{
	// 			name: 'UnApproved Driverlist',
	// 			url: '/app/drivers/unapprovedriverlist',
	// 			icon: 'fa fa-window-close'
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },
	// {
	// 	alias: "Document Management",
	// 	name: 'Document Management',
	// 	url: '/app/documentManagement',
	// 	icon: 'fa fa-file',
	// 	children: [
	// 		{
	// 			name: 'Document List',
	// 			url: '/app/documentManagement/list',
	// 			icon: 'fa fa-list-ul'
	// 		},
	// 		{
	// 			name: 'Add Document',
	// 			url: '/app/documentManagement/add',
	// 			icon: 'fa fa-plus-circle'
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },




	// {
	// 	alias: "vehicle",
	// 	name: 'Vehicle',
	// 	url: '/app/vehicle',
	// 	icon: 'fa fa-car',
	// 	children: [
	// 		{
	// 			name: 'Vehicle List',
	// 			url: '/app/vehicle/list',
	// 			icon: 'fa fa-list-ul'
	// 		},
	// 		{
	// 			name: 'Add Vehicle',
	// 			url: '/app/vehicle/add',
	// 			icon: 'fa fa-plus-circle'
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },
	// {
	// 	alias: "notification",
	// 	name: 'Push Notification',
	// 	url: '/app/notification',
	// 	icon: 'fa fa-send',
	// 	children: [
	// 		{
	// 			name: 'User',
	// 			url: '/app/notification/list',
	// 			icon: 'fa fa-user-o'
	// 		},
	// 		{
	// 			name: 'Template',
	// 			url: '/app/notification/templete',
	// 			icon: 'fa fa-list-alt'
	// 		},
	// 		{
	// 			name: 'driver',
	// 			url: '/app/notification/driverlist',
	// 			icon: 'fa fa-user-o'
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },
	// {
	// 	alias: "language",
	// 	name: 'Languages',
	// 	url: '/app/language',
	// 	icon: 'fa fa-language',
	// 	children: [
	// 		{
	// 			name: 'Language List',
	// 			url: '/app/language/list',
	// 			icon: 'fa fa-th-list'
	// 		},
	// 		{
	// 			name: 'Add Language',
	// 			url: '/app/language/add',
	// 			icon: 'fa fa-plus-circle',
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },
	// {
	// 	alias: "mapview",
	// 	name: 'Map View',
	// 	url: '/app/mapview',
	// 	icon: 'fa fa-map-marker',
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },
	// {
	// 	alias: "Units",
	// 	name: 'Units/Metrics',
	// 	url: '/app/units',
	// 	icon: 'fa fa-bars',
	// 	children: [
	// 		{
	// 			name: 'units-add',
	// 			url: '/app/units/units-add',
	// 			icon: 'fa fa-list-ul'
	// 		},
	// 		{
	// 			name: 'units-list',
	// 			url: '/app/units/units-list',
	// 			icon: 'fa fa-plus-circle'
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },

	// {
	// 	alias: "taxmanagement",
	// 	name: 'Tax Management',
	// 	url: '/app/taxmanagement',
	// 	icon: 'fa fa-bar-chart',
	// 	children: [
	// 		{
	// 			name: 'Tax List',
	// 			url: '/app/taxmanagement/list',
	// 			icon: 'fa fa-list-ul'
	// 		},
	// 		{
	// 			name: 'Add Tax',
	// 			url: '/app/taxmanagement/add',
	// 			icon: 'fa fa-plus-circle'
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },

	// {
	// 	alias: "Time Slots",
	// 	name: 'Time Slots',
	// 	url: '/app/timeSlots',
	// 	icon: 'fa fa-clock-o',
	// 	children: [
	// 		{
	// 			name: 'Time Slots List',
	// 			url: '/app/timeSlots/list',
	// 			icon: 'fa fa-list-ul'
	// 		},
	// 		{
	// 			name: 'Add Time Slot',
	// 			url: '/app/timeSlots/add',
	// 			icon: 'fa fa-plus-circle'
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },

	// {
	// 	alias: "Site Earnings",
	// 	name: 'Site Earnings',
	// 	url: '/app/adminearnings',
	// 	icon: 'fa fa-envelope',
	// 	children: [
	// 		{
	// 			name: 'Admin Earnings',
	// 			url: '/app/adminearnings/adminearningslist',
	// 			icon: 'fa fa-list-alt'
	// 		},
	// 	],
	// 	status: {
	// 		add: false,
	// 		edit: false,
	// 		view: false,
	// 		delete: false
	// 	}
	// },

];
export default data;