export class BidirectionalMap {
  constructor() {
    this.keyToValue = new Map();
    this.valueToKey = new Map();
  }
  
  set(key, value) {
    this.keyToValue.set(key.toLowerCase(), value.toLowerCase());
    this.valueToKey.set(value.toLowerCase(), key.toLowerCase());
  }
  
  getByKey(key) {
    return this.keyToValue.get(key.toLowerCase());
  }
  
  getByValue(value) {
    return this.valueToKey.get(value.toLowerCase());
  }
  
  delete(key) {
    const value = this.keyToValue.get(key.toLowerCase());
    this.keyToValue.delete(key.toLowerCase());
    this.valueToKey.delete(value);
  }
}
