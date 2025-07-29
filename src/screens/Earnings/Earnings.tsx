"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
    Text,
    View,
    ActivityIndicator,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
} from "react-native"
import { useSelector } from "react-redux"
import axios from "axios"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
import { COLORS, SIZES, WEIGHTS, SPACING, RADIUS } from "../../../constant/ui"
import { API_URL_APP } from "../../../constant/api"
import OlyoxTabBar from "../../components/common/UberTabBar"

interface RideData {
    _id: string
    route_info: {
        distance: number
        duration: number
        waypoints: any[]
    }
    driver_rating: {
        rating: number
        feedback: string
        created_at: string
    }
    pickup_address: {
        formatted_address: string
    }
    drop_address: {
        formatted_address: string
    }
    ride_status: string
    requested_at: string
    pricing: {
        base_fare: number
        distance_fare: number
        time_fare: number
        platform_fee: number
        night_charge: number
        rain_charge: number
        collected_amount: number
        toll_charge: number
        discount: number
        total_fare: number
        currency: string
    }
    payment_method: string
    payment_status: string
    cancellation_fee: number
    driver: string
    driver_assigned_at: string
    eta: number
    driver_arrived_at: string
    ride_started_at: string
    ride_ended_at: string
    createdAt: string
    fare?: number
}

const Earnings: React.FC = () => {
    const [earnings, setEarnings] = useState<RideData[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { token, isAuthenticated } = useSelector((state: any) => state.login)

    const fetchData = async (isRefresh = false) => {
        if (!isAuthenticated) return

        if (isRefresh) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }

        setError(null)

        try {
            const { data } = await axios.get(`${API_URL_APP}rider/getMyAllRides`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            console.log("Rides Data:", data.data)
            setEarnings(data?.data || [])
        } catch (err: any) {
            console.error("Error fetching earnings:", err)
            setError("Failed to load data")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const onRefresh = () => {
        fetchData(true)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatAddress = (address: string) => {
        return address.length > 40 ? `${address.substring(0, 40)}...` : address
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
                return COLORS.success
            case "cancelled":
                return COLORS.error
            case "ongoing":
                return COLORS.warning
            default:
                return COLORS.gray
        }
    }

    const calculateTotalEarnings = () => {
        return earnings.reduce((total, ride) => {
            return total + (ride.pricing?.total_fare || ride.fare || 0)
        }, 0)
    }

    const renderRideItem = ({ item }: { item: RideData }) => (
        <TouchableOpacity style={styles.rideCard} activeOpacity={0.7}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View style={styles.rideIdContainer}>
                    <Text style={styles.rideIdText}>#{item._id.slice(-6).toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.ride_status) }]}>
                        <Text style={styles.statusText}>{item.ride_status.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.dateText}>{formatDate(item.createdAt || item.requested_at)}</Text>
            </View>

            {/* Route Info */}
            <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                    <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
                    <Text style={styles.addressText}>
                        {formatAddress(item.pickup_address?.formatted_address || "Pickup location")}
                    </Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                    <View style={[styles.routeDot, { backgroundColor: COLORS.error }]} />
                    <Text style={styles.addressText}>
                        {formatAddress(item.drop_address?.formatted_address || "Drop location")}
                    </Text>
                </View>
            </View>

            {/* Trip Details */}
            <View style={styles.tripDetails}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Distance</Text>
                    <Text style={styles.detailValue}>{item.route_info?.distance?.toFixed(1) || "N/A"} km</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{item.route_info?.duration || "N/A"} min</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Payment</Text>
                    <Text style={styles.detailValue}>{item.payment_method || "N/A"}</Text>
                </View>
            </View>

            {/* Pricing */}
            <View style={styles.pricingContainer}>
                <View style={styles.fareBreakdown}>
                    <Text style={styles.fareLabel}>Base Fare</Text>
                    <Text style={styles.fareValue}>₹{item.pricing?.base_fare || 0}</Text>
                </View>
                {item.pricing?.distance_fare > 0 && (
                    <View style={styles.fareBreakdown}>
                        <Text style={styles.fareLabel}>Distance Fare</Text>
                        <Text style={styles.fareValue}>₹{item.pricing.distance_fare}</Text>
                    </View>
                )}
                {item.pricing?.platform_fee > 0 && (
                    <View style={styles.fareBreakdown}>
                        <Text style={styles.fareLabel}>Platform Fee</Text>
                        <Text style={styles.fareValue}>₹{item.pricing.platform_fee}</Text>
                    </View>
                )}
                <View style={styles.totalFareContainer}>
                    <Text style={styles.totalFareLabel}>Total Earned</Text>
                    <Text style={styles.totalFareValue}>₹{item.pricing?.total_fare || item.fare || 0}</Text>
                </View>
            </View>

            {/* Rating */}
            {item.driver_rating?.rating && (
                <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>⭐ {item.driver_rating.rating}/5</Text>
                </View>
            )}
        </TouchableOpacity>
    )

    const renderHeader = () => (
        <View style={styles.headerContainer}>

            <View style={styles.totalEarningsContainer}>
                <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
                <Text style={styles.totalEarningsValue}>₹{calculateTotalEarnings().toFixed(2)}</Text>
            </View>
        </View>
    )

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No rides found</Text>
            <Text style={styles.emptySubtitle}>Start driving to see your earnings here</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={() => fetchData()}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
        </View>
    )

    const renderError = () => (
        <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
                <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    )

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading your earnings...</Text>
            </View>
        )
    }

    if (error && !refreshing) {
        return renderError()
    }

    return (
        <OlyoxTabBar
        activeTab={'earnings'}
            isBottomShow={false}
        >


            <View style={styles.container}>
                <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
                <FlatList
                    data={earnings}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    renderItem={renderRideItem}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={renderEmptyState}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                        />
                    }
                />
            </View>
        </OlyoxTabBar>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContainer: {
        padding: scale(SPACING.medium),
        paddingBottom: verticalScale(SPACING.xxl),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: verticalScale(SPACING.medium),
        fontSize: moderateScale(SIZES.medium),
        color: COLORS.gray,
        fontWeight: WEIGHTS.medium,
    },
    headerContainer: {
        marginBottom: verticalScale(SPACING.large),
    },
    headerTitle: {
        fontSize: moderateScale(SIZES.medium),
        fontWeight: WEIGHTS.bold,
        color: COLORS.dark,
        marginBottom: verticalScale(SPACING.medium),
    },
    totalEarningsContainer: {
        backgroundColor: COLORS.primary,
        padding: scale(SPACING.large),
        borderRadius: scale(RADIUS.large),
        alignItems: "center",
    },
    totalEarningsLabel: {
        fontSize: moderateScale(SIZES.medium),
        color: COLORS.light,
        fontWeight: WEIGHTS.medium,
        marginBottom: verticalScale(SPACING.xs),
    },
    totalEarningsValue: {
        fontSize: moderateScale(SIZES.xxxl),
        color: COLORS.light,
        fontWeight: WEIGHTS.bold,
    },
    rideCard: {
        backgroundColor: COLORS.card,
        borderRadius: scale(RADIUS.large),
        padding: scale(SPACING.large),
        marginBottom: verticalScale(SPACING.medium),
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: verticalScale(2),
        },
        shadowOpacity: 0.1,
        shadowRadius: scale(4),
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: verticalScale(SPACING.medium),
    },
    rideIdContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    rideIdText: {
        fontSize: moderateScale(SIZES.large),
        fontWeight: WEIGHTS.bold,
        color: COLORS.dark,
        marginRight: scale(SPACING.small),
    },
    statusBadge: {
        paddingHorizontal: scale(SPACING.small),
        paddingVertical: verticalScale(SPACING.xs),
        borderRadius: scale(RADIUS.small),
    },
    statusText: {
        fontSize: moderateScale(SIZES.xs),
        color: COLORS.light,
        fontWeight: WEIGHTS.bold,
    },
    dateText: {
        fontSize: moderateScale(SIZES.small),
        color: COLORS.gray,
        fontWeight: WEIGHTS.medium,
    },
    routeContainer: {
        marginBottom: verticalScale(SPACING.medium),
    },
    routePoint: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: verticalScale(SPACING.xs),
    },
    routeDot: {
        width: scale(8),
        height: scale(8),
        borderRadius: scale(4),
        marginRight: scale(SPACING.small),
    },
    routeLine: {
        width: scale(1),
        height: verticalScale(20),
        backgroundColor: COLORS.lightGray,
        marginLeft: scale(4),
        marginVertical: verticalScale(SPACING.xs),
    },
    addressText: {
        fontSize: moderateScale(SIZES.small),
        color: COLORS.darkGray,
        fontWeight: WEIGHTS.medium,
        flex: 1,
    },
    tripDetails: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: verticalScale(SPACING.medium),
        paddingVertical: verticalScale(SPACING.small),
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
    },
    detailItem: {
        alignItems: "center",
    },
    detailLabel: {
        fontSize: moderateScale(SIZES.small),
        color: COLORS.gray,
        fontWeight: WEIGHTS.medium,
        marginBottom: verticalScale(SPACING.xs),
    },
    detailValue: {
        fontSize: moderateScale(SIZES.medium),
        color: COLORS.dark,
        fontWeight: WEIGHTS.semiBold,
    },
    pricingContainer: {
        marginBottom: verticalScale(SPACING.small),
    },
    fareBreakdown: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: verticalScale(SPACING.xs),
    },
    fareLabel: {
        fontSize: moderateScale(SIZES.small),
        color: COLORS.gray,
        fontWeight: WEIGHTS.medium,
    },
    fareValue: {
        fontSize: moderateScale(SIZES.small),
        color: COLORS.dark,
        fontWeight: WEIGHTS.medium,
    },
    totalFareContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: verticalScale(SPACING.small),
        borderTopWidth: 1,
        borderColor: COLORS.border,
    },
    totalFareLabel: {
        fontSize: moderateScale(SIZES.medium),
        color: COLORS.dark,
        fontWeight: WEIGHTS.semiBold,
    },
    totalFareValue: {
        fontSize: moderateScale(SIZES.large),
        color: COLORS.success,
        fontWeight: WEIGHTS.bold,
    },
    ratingContainer: {
        alignItems: "flex-end",
        marginTop: verticalScale(SPACING.small),
    },
    ratingText: {
        fontSize: moderateScale(SIZES.small),
        color: COLORS.warning,
        fontWeight: WEIGHTS.medium,
    },
    emptyContainer: {
        alignItems: "center",
        paddingVertical: verticalScale(SPACING.xxxl),
    },
    emptyTitle: {
        fontSize: moderateScale(SIZES.xl),
        fontWeight: WEIGHTS.bold,
        color: COLORS.dark,
        marginBottom: verticalScale(SPACING.small),
    },
    emptySubtitle: {
        fontSize: moderateScale(SIZES.medium),
        color: COLORS.gray,
        textAlign: "center",
        marginBottom: verticalScale(SPACING.large),
    },
    refreshButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: scale(SPACING.xl),
        paddingVertical: verticalScale(SPACING.medium),
        borderRadius: scale(RADIUS.medium),
    },
    refreshButtonText: {
        color: COLORS.light,
        fontSize: moderateScale(SIZES.medium),
        fontWeight: WEIGHTS.semiBold,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: scale(SPACING.xl),
        backgroundColor: COLORS.background,
    },
    errorTitle: {
        fontSize: moderateScale(SIZES.xl),
        fontWeight: WEIGHTS.bold,
        color: COLORS.error,
        marginBottom: verticalScale(SPACING.small),
        textAlign: "center",
    },
    errorSubtitle: {
        fontSize: moderateScale(SIZES.medium),
        color: COLORS.gray,
        textAlign: "center",
        marginBottom: verticalScale(SPACING.large),
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: scale(SPACING.xl),
        paddingVertical: verticalScale(SPACING.medium),
        borderRadius: scale(RADIUS.medium),
    },
    retryButtonText: {
        color: COLORS.light,
        fontSize: moderateScale(SIZES.medium),
        fontWeight: WEIGHTS.semiBold,
    },
})

export default Earnings
