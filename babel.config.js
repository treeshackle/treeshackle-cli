module.exports = {
  presets: [
    [
      "@babel/preset-env",
      { useBuiltIns: "usage", targets: { node: "current" } }
    ],
    "@babel/preset-typescript"
  ],
  plugins: [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread",
    "source-map-support"
  ]
};
