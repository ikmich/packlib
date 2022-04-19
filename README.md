# `packlib`

Pack and distribute npm library for local development

# Installation

```
npm install -g packlib
```

# Commands

### `init`

Generate packlib config file in project root of the dependency library.

```shell
# Run this in the project root of the dependency library project.
packlib init
```

### `pack`

Pack the library module into a folder.

```shell
# Run in project root of the dependency library project.
packlib pack
```

### `dist`

Distribute the module to destination projects specified in packlib-config.js.

```shell
packlib dist
```