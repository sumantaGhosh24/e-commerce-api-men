import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

import User from "./models/user.model";
import Category from "./models/category.model";
import Brand from "./models/brand.model";
import Product from "./models/product.model";
import Review from "./models/review.model";
import Order from "./models/order.model";
import connectDB from "./config/connectDB";

dotenv.config();

connectDB();

const seedDB = async () => {
  try {
    console.log("Database seeding started...");

    console.log("Creating admin...");
    const admin = new User({
      email: faker.internet
        .email({ firstName: "test", lastName: "admin" })
        .toLowerCase(),
      mobileNumber: faker.phone.number({ style: "international" }),
      password: await bcrypt.hash("test@admin", 10),
      firstName: "test",
      lastName: "admin",
      username: faker.internet.username({
        firstName: "test",
        lastName: "admin",
      }),
      image: {
        public_id: "accommodation-booking/tmp-1-1753507651178_azu5rk",
        url: "https://res.cloudinary.com/dzqgzsnoc/image/upload/v1753507657/accommodation-booking/tmp-1-1753507651178_azu5rk.jpg",
      },
      dob: faker.date
        .past({ years: 30, refDate: "2000-01-01" })
        .toISOString()
        .split("T")[0],
      gender: faker.person.gender(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      zip: faker.location.zipCode(),
      addressline: faker.location.streetAddress(),
      status: "active",
      role: "admin",
    });
    await admin.save();
    console.log("Created admin.");

    console.log("Seeding users...");
    const users = [];
    for (let i = 0; i < 5; i++) {
      const firstName = faker.person.firstName().toLowerCase();
      const lastName = faker.person.lastName().toLowerCase();
      const user = new User({
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        mobileNumber: faker.phone.number({ style: "international" }),
        password: await bcrypt.hash(firstName, 10),
        firstName,
        lastName,
        username: faker.internet.username({ firstName, lastName }),
        image: {
          public_id: "accommodation-booking/tmp-1-1753507651178_azu5rk",
          url: "https://res.cloudinary.com/dzqgzsnoc/image/upload/v1753507657/accommodation-booking/tmp-1-1753507651178_azu5rk.jpg",
        },
        dob: faker.date
          .past({ years: 30, refDate: "2000-01-01" })
          .toISOString()
          .split("T")[0],
        gender: faker.person.gender(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        zip: faker.location.zipCode(),
        addressline: faker.location.streetAddress(),
        status: "active",
        role: "user",
      });
      users.push(await user.save());
    }
    console.log(`Seeded ${users.length} users.`);

    console.log("Seeding categories...");
    const categories = [];
    const categoryNames = [
      "Electronics",
      "Mobile",
      "TV",
      "Books",
      "AC",
      "Bed",
      "Kitchen",
      "Student",
      "Shoe",
    ];
    for (let i = 0; i < 10; i++) {
      const name =
        categoryNames[i] || faker.lorem.word({ length: { min: 5, max: 10 } });
      const category = new Category({
        name,
        slug: faker.helpers.slugify(name),
        image: {
          public_id: "accommodation-booking/tmp-1-1753507651178_azu5rk",
          url: "https://res.cloudinary.com/dzqgzsnoc/image/upload/v1753507657/accommodation-booking/tmp-1-1753507651178_azu5rk.jpg",
        },
      });
      categories.push(await category.save());
    }
    console.log(`Seeded ${categories.length} categories.`);

    console.log("Seeding brands...");
    const brands = [];
    const brandNames = ["LG", "Samsung", "Logitech", "Techno", "Vivo", "Nokia"];
    for (let i = 0; i < 10; i++) {
      const name =
        brandNames[i] || faker.lorem.word({ length: { min: 5, max: 10 } });
      const brand = new Brand({
        name,
        slug: faker.helpers.slugify(name),
        image: {
          public_id: "accommodation-booking/tmp-1-1753507651178_azu5rk",
          url: "https://res.cloudinary.com/dzqgzsnoc/image/upload/v1753507657/accommodation-booking/tmp-1-1753507651178_azu5rk.jpg",
        },
      });
      brands.push(await brand.save());
    }
    console.log(`Seeded ${brands.length} brands.`);

    console.log("Seeding products...");
    const products = [];
    for (let i = 0; i < 100; i++) {
      const randomCategory = faker.helpers.arrayElement(categories);
      const randomBrand = faker.helpers.arrayElement(brands);
      const product = new Product({
        owner: admin._id,
        title: faker.commerce.productName(),
        images: Array.from({
          length: faker.number.int({ min: 1, max: 5 }),
        }).map(() => ({
          public_id: "accommodation-booking/tmp-1-1753507651178_azu5rk",
          url: "https://res.cloudinary.com/dzqgzsnoc/image/upload/v1753507657/accommodation-booking/tmp-1-1753507651178_azu5rk.jpg",
        })),
        description: faker.commerce.productDescription(),
        content: faker.lorem.paragraphs(3),
        category: randomCategory._id,
        brand: randomBrand._id,
        price: faker.commerce.price(),
        checked: true,
        stock: faker.number.int({ min: 5, max: 100 }),
        sold: faker.number.int({ min: 5, max: 100 }),
      });
      products.push(await product.save());
    }
    console.log(`Seeded ${products.length} products.`);

    console.log("Seeding reviews...");
    const reviews = [];
    for (let i = 0; i < 300; i++) {
      const randomProduct = faker.helpers.arrayElement(products);
      const randomUser = faker.helpers.arrayElement(users);
      const review = new Review({
        product: randomProduct._id,
        user: randomUser._id,
        comment: faker.lorem.sentence(),
        rating: faker.number.int({ min: 1, max: 5 }),
      });
      reviews.push(await review.save());
    }
    console.log(`Seeded ${reviews.length} reviews.`);

    console.log("Seeding orders...");
    const orders = [];
    for (let i = 0; i < 150; i++) {
      const randomUser = faker.helpers.arrayElement(users);

      const numberOfProductsInOrder = faker.number.int({ min: 1, max: 3 });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectedProductsForOrder: any[] = faker.helpers.arrayElements(
        products,
        numberOfProductsInOrder
      );

      const orderItems = selectedProductsForOrder.map(product => ({
        product: product._id,
        quantity: faker.number.int({ min: 1, max: 5 }),
      }));

      const price = orderItems.reduce(
        (acc, item) =>
          acc +
          selectedProductsForOrder.find(p => p._id.equals(item.product)).price *
            item.quantity,
        0
      );

      const taxPrice = price * 0.18;
      const shippingPrice = price * 0.1;
      const totalPrice = price + taxPrice + shippingPrice;

      const isDelivered = faker.datatype.boolean();
      const deliveredAt = isDelivered
        ? faker.date.recent({ days: 30 })
        : undefined;

      const order = new Order({
        user: randomUser._id,
        orderItems,
        shippingAddress: {
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          pin: faker.location.zipCode(),
          country: faker.location.country(),
          state: faker.location.state(),
        },
        paymentResult: {
          id: faker.string.uuid(),
          status: faker.helpers.arrayElement(["paid", "pending", "failed"]),
          razorpay_order_id: faker.string.uuid(),
          razorpay_payment_id: faker.string.uuid(),
          razorpay_signature: faker.string.alphanumeric(32),
        },
        price,
        taxPrice,
        shippingPrice,
        totalPrice,
        isDeliverd: isDelivered,
        deliverAt: deliveredAt,
        status: faker.helpers.arrayElement([
          "pending",
          "completed",
          "cancelled",
        ]),
      });
      orders.push(await order.save());
    }
    console.log(`Seeded ${orders.length} orders.`);

    console.log("Database seeding complete!");
  } catch (error) {
    console.log(error);
  }
};

seedDB();
