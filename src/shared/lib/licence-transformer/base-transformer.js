class BaseTransformer {
  constructor (data) {
    this.data = data;
  }

  export () {
    return this.data;
  }
}

module.exports = BaseTransformer;
