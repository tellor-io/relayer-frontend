#!/bin/bash

# Test Runner Script for Relayer Frontend
# This script provides easy access to different testing modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ]; then
        print_error "This script must be run from the project root directory"
        exit 1
    fi
    
    if [ ! -f "src/components/DataFeed.js" ]; then
        print_error "DataFeed component not found. Are you in the right project?"
        exit 1
    fi
}

# Function to install dependencies if needed
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
    fi
}

# Function to run tests with coverage
run_coverage() {
    print_status "Running tests with coverage report..."
    npm run test:coverage
    
    if [ $? -eq 0 ]; then
        print_success "Coverage report generated successfully!"
        print_status "Open coverage/lcov-report/index.html to view detailed coverage"
    else
        print_error "Tests failed during coverage run"
        exit 1
    fi
}

# Function to run tests in watch mode
run_watch() {
    print_status "Starting tests in watch mode..."
    print_status "Press 'q' to quit, 'a' to run all tests, 'f' to run failed tests"
    npm run test:watch
}

# Function to run tests once
run_once() {
    print_status "Running tests once..."
    npm test
    
    if [ $? -eq 0 ]; then
        print_success "All tests passed!"
    else
        print_error "Some tests failed"
        exit 1
    fi
}

# Function to run CI tests
run_ci() {
    print_status "Running tests for CI/CD pipeline..."
    npm run test:ci
    
    if [ $? -eq 0 ]; then
        print_success "CI tests completed successfully!"
    else
        print_error "CI tests failed"
        exit 1
    fi
}

# Function to debug tests
run_debug() {
    print_status "Starting tests in debug mode..."
    print_status "Open Chrome DevTools and go to chrome://inspect"
    npm run test:debug
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  coverage    Run tests with coverage report"
    echo "  watch       Run tests in watch mode (default)"
    echo "  once        Run tests once"
    echo "  ci          Run tests for CI/CD pipeline"
    echo "  debug       Run tests in debug mode"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Run in watch mode"
    echo "  $0 coverage     # Run with coverage"
    echo "  $0 ci           # Run CI tests"
    echo ""
}

# Main script logic
main() {
    # Check if we're in the right directory
    check_directory
    
    # Check dependencies
    check_dependencies
    
    # Parse command line arguments
    case "${1:-watch}" in
        "coverage")
            run_coverage
            ;;
        "watch")
            run_watch
            ;;
        "once")
            run_once
            ;;
        "ci")
            run_ci
            ;;
        "debug")
            run_debug
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_warning "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
