export class BidirectionalMap {
  constructor() {
    this.keyToValue = new Map();
    this.valueToKey = new Map();
  }
  
  set(key, value) {
    this.keyToValue.set(key, value.toLowerCase());
    this.valueToKey.set(value.toLowerCase(), key);
  }
  
  getByKey(key) {
    return this.keyToValue.get(key);
  }
  
  getByValue(value) {
    return this.valueToKey.get(value.toLowerCase());
  }
  
  delete(key) {
    const value = this.keyToValue.get(key);
    this.keyToValue.delete(key);
    this.valueToKey.delete(value);
  }
}
