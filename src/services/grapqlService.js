const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT;


export async function graphqlQuery(query, variables = {}) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });
    
    const result = await response.json();
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message);
    }
    return result.data;
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
}


export async function getPaginatedFeedData(queryId, network, limit, offset) {
  const data = await graphqlQuery(`
    query GetPaginatedData($queryId: String!, $network: String!, $limit: Int!, $offset: Int!) {
      oracleUpdatesConnection(
        orderBy: reportTimestamp_DESC,
        where: { queryId_eq: $queryId, network_eq: $network }
      ) {
        totalCount
      }
      oracleUpdates(
        orderBy: reportTimestamp_DESC
        where: { queryId_eq: $queryId, network_eq: $network }
        limit: $limit
        offset: $offset
      ) {
        reportValue
        reportAggregatePower
        reportTimestamp
        attestationTimestamp
        relayTimestamp
        blockNumber
        transactionHash
        index
      }
    }
  `, { queryId, network, limit, offset });
  
  return {
    updates: data?.oracleUpdates || [],
    totalCount: data?.oracleUpdatesConnection?.totalCount || 0
  };
}

export async function getChartData(queryId, network, startTime, endTime) {

  const data = await graphqlQuery(`
    query GetChartData($queryId: String!, $network: String!, $startTime: DateTime!, $endTime: DateTime!) {
      oracleUpdates(
        where: {
          queryId_eq: $queryId,
          network_eq: $network,
          blockTimestamp_gte: $startTime, 
          blockTimestamp_lte: $endTime
        }
        orderBy: blockTimestamp_DESC
        limit: 5000
      ) {
        reportValue
        reportAggregatePower
        reportTimestamp
        attestationTimestamp
        relayTimestamp
        blockNumber
        transactionHash
        index
    }
}`, { queryId, network, startTime: new Date(Number(startTime) * 1000).toISOString(),
    endTime: new Date(Number(endTime) * 1000).toISOString()});

  return data?.oracleUpdates || [];
}

export async function getOverviewData() {
  const data = await graphqlQuery(`
    query GetOverviewData {
      latestUpdates {
        queryId
        network
        reportValue
        reportTimestamp
        transactionHash
      }
    }
  `);

  return data?.latestUpdates || [];
}