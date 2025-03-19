export const TELLOR_CONTRACT_ADDRESS = "0x4DDb9915bA04481e44Ff85Cb519d34036AF71582";

export const TELLOR_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_queryId",
        "type": "bytes32"
      }
    ],
    "name": "getCurrentValue",
    "outputs": [
      {
        "internalType": "bool",
        "name": "_ifRetrieve",
        "type": "bool"
      },
      {
        "internalType": "bytes",
        "name": "_value",
        "type": "bytes"
      },
      {
        "internalType": "uint256",
        "name": "_timestampRetrieved",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  "function getDataBefore(bytes32 _queryId, uint256 _timestamp) external view returns (bool _ifRetrieve, bytes memory _value, uint256 _timestampRetrieved)",
  "function getIndexForDataBefore(bytes32 _queryId, uint256 _timestamp) external view returns (bool _found, uint256 _index)",
  "function getMultipleValuesBefore(bytes32 _queryId, uint256 _timestamp, uint256 _maxAge, uint256 _maxCount) external view returns (bytes[] memory _values, uint256[] memory _timestamps)"
]; 