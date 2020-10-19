import { Resolver, Query, Field, InputType, ObjectType, Mutation, Arg, Ctx } from 'type-graphql';
import { User } from '../entities/User';
import { MyContext } from '../types';
import argon2 from 'argon2'

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string

  @Field()
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[];

  @Field(() => User, {nullable: true})
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, {nullable: true})
  async me(
    @Ctx() { em, req }: MyContext
  ) {
    if(!req.session.userId) {
      return null;
    }

    const user = await em.findOne(User, {id: req.session.userId});
    return user;
  }


  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const username = options.username.trim()
    const password = options.password
    if(username.length <= 2) {
      return {
        errors: [{
          field: 'username',
          message: 'length must be greater than 2'
        }]
      }
    }

    if(password.length <= 2) {
      return {
        errors: [{
          field: 'password',
          message: 'length must be greater than 2'
        }]
      }
    }

    const hashedPassword = await argon2.hash(password);
    const user = em.create(User, {
      username: username,
      password: hashedPassword
    });
    try {
      await em.persistAndFlush(user);
    } catch(err) {
      // Duplicate username error
      if(err.code === '23505' ) { // || err.detail.includes('already exists')
        return {
          errors: [{
            field: "username",
            message: "username has already been taken"
          }]
        }
      }
    }

    req.session.userId = user.id

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, {username: options.username})
    if(!user) {
      return {
        errors: [
          {
            field: 'username',
            message: "The user doesn't exist"
          }
        ]
      }
    }
    const valid = await argon2.verify(user.password, options.password)
    if(!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: "Incorrect password"
          }
        ]
      }
    }

    req.session.userId = user.id

    return {user};
  }
}
