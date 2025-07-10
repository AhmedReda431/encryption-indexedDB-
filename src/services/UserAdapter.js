export class UserAdapter {
  constructor(config = {}) {
    this.config = {
      nameSplitter: (name) => {
        const [firstName, ...lastNameParts] = name.split(" ");
        return {
          firstName,
          lastName: lastNameParts.join(" "),
        };
      },
      ...config,
    };
  }

  adapt(user) {
    const { id, name, ...rest } = user;
    const { firstName, lastName } = this.config.nameSplitter(
      name || "Unknown User"
    );
    return {
      ...rest,
      username: user.username || id, // Prefer input username if provided
      firstName,
      lastName,
      maskedName: `**** ${lastName.slice(-2)}`,
    };
  }
}
