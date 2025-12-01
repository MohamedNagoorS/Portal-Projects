export const mockData = {
  profile: {
    CUSTOMER_ID: 'CUST001',
    CUSTOMER_NAME: 'Acme Corporation',
    COMPANY_NAME: 'Acme Corporation',
    ADDRESS: '123 Main Street',
    CITY: 'New York',
    STATE: 'NY',
    POSTAL_CODE: '10001',
    COUNTRY: 'USA',
    PHONE: '+1-555-0123',
    EMAIL: 'contact@acmecorp.com',
    TAX_ID: '12-3456789',
    CREDIT_LIMIT: '100000.00',
    PAYMENT_TERMS: 'Net 30',
    CURRENCY: 'USD'
  },
  inquiry: {
    IT_INQUIRY: [
      {
        INQUIRY_NUMBER: 'INQ001',
        INQUIRY_DATE: '2024-01-15',
        STATUS: 'Open',
        NET_VALUE: '5000.00',
        CURRENCY: 'USD',
        DESCRIPTION: 'Product Inquiry - Q1 2024'
      },
      {
        INQUIRY_NUMBER: 'INQ002',
        INQUIRY_DATE: '2024-01-20',
        STATUS: 'Closed',
        NET_VALUE: '3000.00',
        CURRENCY: 'USD',
        DESCRIPTION: 'Service Inquiry'
      },
      {
        INQUIRY_NUMBER: 'INQ003',
        INQUIRY_DATE: '2024-02-10',
        STATUS: 'Open',
        NET_VALUE: '8500.00',
        CURRENCY: 'USD',
        DESCRIPTION: 'Bulk Order Inquiry'
      }
    ]
  },
  salesorder: {
    IT_SALESORDER: [
      {
        SALES_ORDER: 'SO001',
        ORDER_DATE: '2024-01-10',
        STATUS: 'Delivered',
        NET_VALUE: '10000.00',
        CURRENCY: 'USD',
        DELIVERY_DATE: '2024-01-20',
        ITEMS: '5'
      },
      {
        SALES_ORDER: 'SO002',
        ORDER_DATE: '2024-01-25',
        STATUS: 'In Process',
        NET_VALUE: '7500.00',
        CURRENCY: 'USD',
        DELIVERY_DATE: '2024-02-15',
        ITEMS: '3'
      },
      {
        SALES_ORDER: 'SO003',
        ORDER_DATE: '2024-02-05',
        STATUS: 'Pending',
        NET_VALUE: '12000.00',
        CURRENCY: 'USD',
        DELIVERY_DATE: '2024-02-25',
        ITEMS: '8'
      }
    ]
  },
  deliveries: {
    IT_DELIVERIES: [
      {
        DELIVERY_NUMBER: 'DEL001',
        DELIVERY_DATE: '2024-01-12',
        STATUS: 'Completed',
        SALES_ORDER: 'SO001',
        TRACKING_NUMBER: 'TRK123456789'
      },
      {
        DELIVERY_NUMBER: 'DEL002',
        DELIVERY_DATE: '2024-01-28',
        STATUS: 'In Transit',
        SALES_ORDER: 'SO002',
        TRACKING_NUMBER: 'TRK987654321'
      },
      {
        DELIVERY_NUMBER: 'DEL003',
        DELIVERY_DATE: '2024-02-15',
        STATUS: 'Scheduled',
        SALES_ORDER: 'SO003',
        TRACKING_NUMBER: 'TRK456789123'
      }
    ]
  },
  invoices: {
    IT_INVOICE: [
      {
        INVOICE_NUMBER: 'INV001',
        INVOICE_DATE: '2024-01-15',
        DUE_DATE: '2024-02-14',
        AMOUNT: '10000.00',
        PAID_AMOUNT: '10000.00',
        BALANCE: '0.00',
        STATUS: 'Paid',
        CURRENCY: 'USD'
      },
      {
        INVOICE_NUMBER: 'INV002',
        INVOICE_DATE: '2024-02-01',
        DUE_DATE: '2024-03-03',
        AMOUNT: '7500.00',
        PAID_AMOUNT: '0.00',
        BALANCE: '7500.00',
        STATUS: 'Pending',
        CURRENCY: 'USD'
      },
      {
        INVOICE_NUMBER: 'INV003',
        INVOICE_DATE: '2024-02-10',
        DUE_DATE: '2024-03-12',
        AMOUNT: '12000.00',
        PAID_AMOUNT: '5000.00',
        BALANCE: '7000.00',
        STATUS: 'Partial',
        CURRENCY: 'USD'
      }
    ]
  },
  aging: {
    IT_AGING: [
      {
        AGING_BUCKET: '0-30 Days',
        AMOUNT: '5000.00'
      },
      {
        AGING_BUCKET: '31-60 Days',
        AMOUNT: '3000.00'
      },
      {
        AGING_BUCKET: '61-90 Days',
        AMOUNT: '2000.00'
      },
      {
        AGING_BUCKET: '90+ Days',
        AMOUNT: '1000.00'
      }
    ]
  },
  memos: {
    IT_MEMO: [
      {
        MEMO_NUMBER: 'MEMO001',
        MEMO_DATE: '2024-01-20',
        AMOUNT: '500.00',
        TYPE: 'Credit',
        REASON: 'Returned Goods',
        STATUS: 'Applied',
        CURRENCY: 'USD'
      },
      {
        MEMO_NUMBER: 'MEMO002',
        MEMO_DATE: '2024-02-05',
        AMOUNT: '250.00',
        TYPE: 'Debit',
        REASON: 'Additional Charges',
        STATUS: 'Pending',
        CURRENCY: 'USD'
      },
      {
        MEMO_NUMBER: 'MEMO003',
        MEMO_DATE: '2024-02-12',
        AMOUNT: '1000.00',
        TYPE: 'Credit',
        REASON: 'Discount Adjustment',
        STATUS: 'Applied',
        CURRENCY: 'USD'
      }
    ]
  },
  salesSummary: {
    TOTAL_SALES: '50000.00',
    YEAR_TO_DATE: '45000.00',
    MONTH_TO_DATE: '15000.00'
  },
  dashboard: {
    inquiry: {
      IT_INQUIRY: [
        {
          INQUIRY_NUMBER: 'INQ001',
          INQUIRY_DATE: '2024-01-15',
          STATUS: 'Open',
          NET_VALUE: '5000.00'
        },
        {
          INQUIRY_NUMBER: 'INQ003',
          INQUIRY_DATE: '2024-02-10',
          STATUS: 'Open',
          NET_VALUE: '8500.00'
        }
      ]
    },
    salesorder: {
      IT_SALESORDER: [
        {
          SALES_ORDER: 'SO001',
          ORDER_DATE: '2024-01-10',
          STATUS: 'Delivered',
          NET_VALUE: '10000.00'
        },
        {
          SALES_ORDER: 'SO002',
          ORDER_DATE: '2024-01-25',
          STATUS: 'In Process',
          NET_VALUE: '7500.00'
        },
        {
          SALES_ORDER: 'SO003',
          ORDER_DATE: '2024-02-05',
          STATUS: 'Pending',
          NET_VALUE: '12000.00'
        }
      ]
    },
    deliveries: {
      IT_DELIVERIES: [
        {
          DELIVERY_NUMBER: 'DEL001',
          DELIVERY_DATE: '2024-01-12',
          STATUS: 'Completed'
        },
        {
          DELIVERY_NUMBER: 'DEL002',
          DELIVERY_DATE: '2024-01-28',
          STATUS: 'In Transit'
        }
      ]
    },
    salesSummary: {
      TOTAL_SALES: '50000.00',
      YEAR_TO_DATE: '45000.00',
      MONTH_TO_DATE: '15000.00'
    }
  }
};

