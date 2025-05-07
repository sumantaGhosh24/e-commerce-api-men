import {Query} from "mongoose";

interface QueryString {
  page?: string;
  limit?: string;
  sort?: string;
  search?: string;
  [key: string]: any;
}

class APIFeatures<T> {
  query: Query<T[], T>;
  queryString: QueryString;

  constructor(query: Query<T[], T>, queryString: QueryString) {
    this.query = query;
    this.queryString = queryString;
  }

  paginating() {
    const page = parseInt(this.queryString.page || "1", 10);
    const limit = parseInt(this.queryString.limit || "10", 10);
    const skip = limit * (page - 1);

    this.query = this.query.limit(limit).skip(skip);
    return this;
  }

  sorting() {
    const sort = this.queryString.sort || "-createdAt";
    this.query = this.query.sort(sort);
    return this;
  }

  searching() {
    const search = this.queryString.search;
    if (search) {
      this.query = this.query.find({
        $text: {$search: search},
      });
    } else {
      this.query = this.query.find();
    }
    return this;
  }

  filtering() {
    const queryObj = {...this.queryString};
    const excludeFields = ["page", "sort", "limit", "search"];
    excludeFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lt|lte|regex)\b/g,
      (match) => "$" + match
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }
}

export {APIFeatures};
