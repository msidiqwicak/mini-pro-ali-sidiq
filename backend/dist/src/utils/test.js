const test = (errors) => ({
    success: false,
    message: "foo",
    data: null,
    ...(errors && { errors })
});
export {};
