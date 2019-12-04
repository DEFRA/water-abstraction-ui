const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingBatchCreateService extends ServiceClient {
  getBillingRegions () {
    const uri = this.joinUrl('regions');
    return this.serviceRequest.get(uri);
  }

  createBillingBatch (batch) {
    const uri = this.joinUrl('billing/batches');
    const options = {
      body: batch
    };
    return this.serviceRequest.post(uri, options);
  }

  getBillRunList (pageNumber) {
    const billRunList = {
      data:
      [
        {
          'event_id': '83a18e3d-473d-4b36-8c8a-0b1c373dac21',
          'metadata': {
            'batch':
          { 'season': 'all year',
            'status': 'processing',
            'region_id': '07ae7f3a-2677-4102-b352-cc006828948c',
            'batch_type': 'supplementary',
            'date_created': '2019-11-29T12:24:06.585Z',
            'date_updated': '2019-11-29T12:24:06.585Z',
            'billing_batch_id': '8ae7c31b-3c5a-44b8-baa5-a10b40aef9e2',
            'to_financial_year_ending': 2020,
            'from_financial_year_ending': 2014,
            'invoices': {
              'count': 12,
              'total': 1234.56
            }
          }
          },
          'status': 'processing'
        },
        { 'event_id': '7e53df2e-5dcf-45d5-9a67-79ea57c122ec',
          'metadata': {
            'batch': {
              'season': 'all year',
              'status': 'processing',
              'region_id': 'd8a257d4-b5a9-4420-ad51-d4fbe07b0f1a',
              'batch_type': 'supplementary',
              'date_created': '2019-11-28T12:24:29.449Z',
              'date_updated': '2019-11-28T12:24:29.449Z',
              'billing_batch_id': 'b456f227-46c0-4354-a923-ad449671ad5d',
              'to_financial_year_ending': 2020,
              'from_financial_year_ending': 2014,
              'invoices': {
                'count': 12,
                'total': 1234.56
              }
            }
          },
          'status': 'complete'
        },
        {
          'event_id': 'b7479dea-1cb8-4d30-a4c6-ec8a8d760f47',
          'metadata': {
            'batch': {
              'season': 'all year',
              'status': 'processing',
              'region_id': '1f57873f-7721-4c6c-a4e1-e935c14c4e42',
              'batch_type': 'supplementary',
              'date_created': '2019-11-27T12:25:03.368Z',
              'date_updated': '2019-11-27T12:25:03.368Z',
              'billing_batch_id': 'bcaf2579-7da6-425e-a101-5117af562b80',
              'to_financial_year_ending': 2020,
              'from_financial_year_ending': 2014,
              'invoices': {
                'count': 12,
                'total': 1234.56
              }
            }
          },
          'status': 'sent'
        },
        {
          'event_id': 'a8f69d9f-46df-443e-8c29-25f39464e087',
          'metadata': {
            'batch': {
              'season': 'all year',
              'status': 'processing',
              'region_id': '8f4f73a9-93d3-4e39-90cd-4913fdfcfcea',
              'batch_type': 'supplementary',
              'date_created': '2019-11-26T14:12:05.549Z',
              'date_updated': '2019-11-26T14:12:05.549Z',
              'billing_batch_id': '505eef34-3565-4c0c-b1b8-66e6ed194f74',
              'to_financial_year_ending': 2020,
              'from_financial_year_ending': 2014,
              'invoices': {
                'count': 12,
                'total': 1234.56
              }
            }
          },
          'status': 'error'
        },
        {
          'event_id': '072a0218-0a79-4795-a443-4e9cd69818d7',
          'metadata': {
            'batch': {
              'season': 'all year',
              'status': 'processing',
              'region_id': '897e37ca-c626-48c0-a9f0-055314cc84e5',
              'batch_type': 'supplementary',
              'date_created': '2019-11-25T14:13:32.158Z',
              'date_updated': '2019-11-25T14:13:32.158Z',
              'billing_batch_id': '107be62b-b859-4d61-90b3-94aab4ec0964',
              'to_financial_year_ending': 2020,
              'from_financial_year_ending': 2014,
              'invoices': {
                'count': 12,
                'total': 1234.56
              }
            }
          },
          'status': 'matching_returns' }
      ]
    };

    const response = {
      billRunList,
      pagination: {
        page: pageNumber,
        pageCount: 4,
        perPage: 2,
        totalRows: 100,
        nextText: 'Later',
        previousText: 'Earlier'
      }
    };

    // no bill runs found in database
    // const Nullresponse = {
    //   billRunList: {
    //     data: []
    //   }
    // };

    return response;
  }
}

module.exports = BillingBatchCreateService;
